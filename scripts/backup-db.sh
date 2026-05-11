#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Studio Bei OS · DB 自动备份（三档自适应，按 env 自动选模式）
#
# ┌─ env 配置                              ┌─ 启用的模式 ─────────────┐
# │ 什么都没配                              │ A. 本地裸 gzip（零配置）  │
# │ BACKUP_ENCRYPT_PASSPHRASE 配了          │ B. 本地加密              │
# │ 上面 + BACKUP_OSS_BUCKET/ENDPOINT 配了  │ C. 加密 + OSS 上传        │
# └────────────────────────────────────────└──────────────────────────┘
#
# 本地保留策略：BACKUP_LOCAL_DIR 下保留最近 BACKUP_LOCAL_KEEP_DAYS 天（默认 /var/backups/studio-bei，7 天）
# OSS  保留策略：由 OSS bucket lifecycle rule 管（建议 7 天）
#
# 必需 env：
#   POSTGRES_PASSWORD                — DB 密码（与 compose.yml 同源）
#
# 可选 env：
#   BACKUP_ENCRYPT_PASSPHRASE        — 备份加密口令（务必另存到密码管理器；丢了备份永远解不开）
#   BACKUP_OSS_BUCKET                — OSS bucket 名（如 studio-bei-backup）
#   BACKUP_OSS_ENDPOINT              — OSS endpoint
#   BACKUP_OSS_PREFIX                — OSS 内前缀（默认 studio-bei-os/）
#   BACKUP_LOCAL_DIR                 — 本地保存目录（默认 /var/backups/studio-bei）
#   BACKUP_LOCAL_KEEP_DAYS           — 本地保留天数（默认 7）
#
# 触发：
#   - systemd timer 每天 04:30 (Asia/Shanghai)：systemctl start studio-bei-backup-db.service
#   - 手动：cd /opt/studio-bei-os && bash scripts/backup-db.sh
#
# 恢复：见 scripts/restore-db.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")/.."

# 加载 .env（导出所有变量；忽略以 # 开头的注释和空行）
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${POSTGRES_PASSWORD:?备份脚本需要 POSTGRES_PASSWORD，请在 .env 配置}"

# 视觉化检测当前模式
HAS_PASS=""
HAS_OSS=""
[ -n "${BACKUP_ENCRYPT_PASSPHRASE:-}" ] && HAS_PASS=1
[ -n "${BACKUP_OSS_BUCKET:-}" ] && [ -n "${BACKUP_OSS_ENDPOINT:-}" ] && HAS_OSS=1

if [ -n "$HAS_OSS" ] && [ -z "$HAS_PASS" ]; then
  echo "❌ 配置矛盾：BACKUP_OSS_BUCKET 配了，但缺 BACKUP_ENCRYPT_PASSPHRASE。"
  echo "   上传到 OSS 必须加密（防止 OSS 权限配错导致明文外泄）。"
  echo "   要么补加 passphrase，要么去掉 OSS_BUCKET 走本地模式。"
  exit 1
fi

LOCAL_DIR="${BACKUP_LOCAL_DIR:-/var/backups/studio-bei}"
LOCAL_KEEP_DAYS="${BACKUP_LOCAL_KEEP_DAYS:-7}"
OSS_PREFIX="${BACKUP_OSS_PREFIX:-studio-bei-os/}"
[[ "$OSS_PREFIX" != */ ]] && OSS_PREFIX="${OSS_PREFIX}/"

mkdir -p "$LOCAL_DIR"

STAMP=$(date +'%Y%m%d-%H%M%S')
if [ -n "$HAS_PASS" ]; then
  FILENAME="studio-bei-${STAMP}.sql.gz.enc"
  MODE_LABEL=$([ -n "$HAS_OSS" ] && echo "C：加密 + OSS" || echo "B：加密本地")
else
  FILENAME="studio-bei-${STAMP}.sql.gz"
  MODE_LABEL="A：裸 gzip 本地（无加密；建议未来加 passphrase）"
fi
DEST="${LOCAL_DIR}/${FILENAME}"

echo "==> [$(date -Iseconds)] 开始备份"
echo "    模式: ${MODE_LABEL}"
echo "    输出: ${DEST}"

# pg_dump 在 postgres 容器内跑，通过 -e PGPASSWORD 传密码，stdout 流式接出来
# --no-owner --no-privileges：恢复时不依赖原 owner/grant，更便携
if [ -n "$HAS_PASS" ]; then
  docker compose exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" postgres \
    pg_dump -h 127.0.0.1 -U studio_bei -d studio_bei \
    --no-owner --no-privileges --clean --if-exists \
    | gzip -9 \
    | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt \
        -pass "env:BACKUP_ENCRYPT_PASSPHRASE" \
    > "$DEST"
else
  docker compose exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" postgres \
    pg_dump -h 127.0.0.1 -U studio_bei -d studio_bei \
    --no-owner --no-privileges --clean --if-exists \
    | gzip -9 \
    > "$DEST"
fi

SIZE_BYTES=$(stat -c%s "$DEST" 2>/dev/null || stat -f%z "$DEST")
SIZE_HR=$(numfmt --to=iec --suffix=B "$SIZE_BYTES" 2>/dev/null || echo "${SIZE_BYTES}B")
echo "    大小: ${SIZE_HR}"

# Sanity check: 大小过小说明 pg_dump 失败（仅 header 字节）
if [ "$SIZE_BYTES" -lt 1024 ]; then
  echo "❌ 备份文件 < 1KB，pg_dump 可能失败，删掉避免污染保留集合"
  rm -f "$DEST"
  exit 1
fi

# 上传 OSS（仅模式 C）
if [ -n "$HAS_OSS" ]; then
  OSS_PATH="oss://${BACKUP_OSS_BUCKET}/${OSS_PREFIX}${FILENAME}"
  echo "==> 上传到 ${OSS_PATH}"
  ossutil cp -f "$DEST" "$OSS_PATH" --endpoint "$BACKUP_OSS_ENDPOINT"
  echo "    OSS:  ${OSS_PATH}"
fi

# 本地保留策略：删除 mtime 超过 LOCAL_KEEP_DAYS 的备份文件
# 注意：只清 studio-bei-*.sql.gz* 模式，避免误删用户的其它文件
PRUNED=$(find "$LOCAL_DIR" -maxdepth 1 -type f \
  \( -name 'studio-bei-*.sql.gz' -o -name 'studio-bei-*.sql.gz.enc' \) \
  -mtime "+${LOCAL_KEEP_DAYS}" -print -delete | wc -l | tr -d ' ')
if [ "$PRUNED" -gt 0 ]; then
  echo "==> 清理 ${PRUNED} 个超过 ${LOCAL_KEEP_DAYS} 天的旧备份"
fi

echo "==> [$(date -Iseconds)] 备份完成"
echo ""
echo "ℹ️  本地最近 5 个备份："
ls -lhrt "$LOCAL_DIR"/studio-bei-*.sql.gz* 2>/dev/null | tail -n 5 | awk '{print "    "$0}'
echo ""
echo "ℹ️  恢复：bash scripts/restore-db.sh <文件路径>"
