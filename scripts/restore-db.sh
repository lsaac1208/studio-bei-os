#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Studio Bei OS · DB 灾难恢复（自适应：按文件名后缀判断是否解密）
#
# 用法：
#   # 本地裸 gzip（模式 A）
#   bash scripts/restore-db.sh /var/backups/studio-bei/studio-bei-20260512-043000.sql.gz
#
#   # 本地加密（模式 B/C）
#   bash scripts/restore-db.sh /var/backups/studio-bei/studio-bei-20260512-043000.sql.gz.enc
#
#   # OSS 路径（模式 C，需 ossutil 与 BACKUP_OSS_ENDPOINT）
#   bash scripts/restore-db.sh oss://studio-bei-backup/studio-bei-os/studio-bei-20260512-043000.sql.gz.enc
#
# ⚠️ 用 --clean --if-exists 覆盖现有 DB 数据。慎用。
#    建议先停 app: docker compose stop app  →  restore  →  docker compose start app
# ─────────────────────────────────────────────────────────────
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "用法: bash scripts/restore-db.sh <备份文件路径或 oss:// URL>"
  exit 1
fi

SRC="$1"

cd "$(dirname "$0")/.."

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${POSTGRES_PASSWORD:?需要 POSTGRES_PASSWORD}"

# 从 OSS 下载到本地
LOCAL_FILE="$SRC"
if [[ "$SRC" == oss://* ]]; then
  : "${BACKUP_OSS_ENDPOINT:?OSS 路径需要 BACKUP_OSS_ENDPOINT}"
  LOCAL_FILE="/tmp/$(basename "$SRC")"
  echo "==> 从 OSS 下载: $SRC → $LOCAL_FILE"
  ossutil cp -f "$SRC" "$LOCAL_FILE" --endpoint "$BACKUP_OSS_ENDPOINT"
fi

if [ ! -f "$LOCAL_FILE" ]; then
  echo "❌ 备份文件不存在: $LOCAL_FILE"
  exit 1
fi

# 判断是否加密：后缀 .enc 视为加密
IS_ENCRYPTED=""
if [[ "$LOCAL_FILE" == *.enc ]]; then
  IS_ENCRYPTED=1
  : "${BACKUP_ENCRYPT_PASSPHRASE:?需要 BACKUP_ENCRYPT_PASSPHRASE（与备份时一致；丢了备份永远解不开）}"
fi

echo "==> 准备恢复 → $LOCAL_FILE"
echo "    模式: $([ -n "$IS_ENCRYPTED" ] && echo "加密备份（AES-256-CBC）" || echo "裸 gzip")"
echo "⚠️  即将覆盖现有 studio_bei 数据库内容。"
echo "    按 Ctrl-C 取消，或回车继续。"
read -r _

# 解密（可选） → gunzip → psql
if [ -n "$IS_ENCRYPTED" ]; then
  echo "==> 解密 + 解压 + 灌库..."
  openssl enc -aes-256-cbc -d -pbkdf2 -iter 200000 -salt \
    -pass "env:BACKUP_ENCRYPT_PASSPHRASE" -in "$LOCAL_FILE" \
    | gunzip \
    | docker compose exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" postgres \
        psql -h 127.0.0.1 -U studio_bei -d studio_bei -v ON_ERROR_STOP=1
else
  echo "==> 解压 + 灌库..."
  gunzip -c "$LOCAL_FILE" \
    | docker compose exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" postgres \
        psql -h 127.0.0.1 -U studio_bei -d studio_bei -v ON_ERROR_STOP=1
fi

echo "==> 恢复完成"
echo "    建议: docker compose restart app  # 让 next 拿最新 schema cache"
