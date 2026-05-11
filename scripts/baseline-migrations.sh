#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Studio Bei OS · drizzle 迁移基线脚本（一次性）
#
# 用途：把现有生产 DB 标记为「已应用 0000_init」，从此走 db:migrate 而非 db:push --force。
#
# 流程（仅本地一次 + 服务器一次）：
#   1) 本地：pnpm db:generate（首次，drizzle 会产出 db/migrations/0000_xxx.sql + meta/_journal.json）
#   2) 本地：git add db/migrations && git commit && git push
#   3) ECS：bash scripts/baseline-migrations.sh   ← 这个脚本
#   4) ECS：从此 deploy.sh 的 step 4 跑的是 drizzle-kit migrate，看到基线行后什么都不做
#
# 安全策略：
#   - 幂等：__drizzle_migrations__ 表如已存在则不破坏
#   - 仅在 0 行时插入基线（避免覆盖真实迁移历史）
#
# 用法：
#   cd /opt/studio-bei-os && bash scripts/baseline-migrations.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "❌ 缺 .env"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

: "${POSTGRES_PASSWORD:?需要 POSTGRES_PASSWORD}"

JOURNAL=db/migrations/meta/_journal.json
if [ ! -f "$JOURNAL" ]; then
  echo "❌ 找不到 ${JOURNAL}"
  echo "请先在本地执行：pnpm db:generate"
  echo "把生成的 db/migrations/* commit + push，再回来跑这个脚本。"
  exit 1
fi

# 取第一条 migration 的 hash + 时间戳
# drizzle-kit 写入 _journal.json 形如：{ "version": "...", "dialect": "postgresql", "entries": [{ "idx": 0, "version": "...", "when": <ms>, "tag": "0000_xxx", "breakpoints": false }] }
# hash 是 .sql 文件内容的 sha256；drizzle-kit migrate 比对的是这个
if ! command -v jq >/dev/null 2>&1; then
  echo "❌ 需要 jq（apt install -y jq 或 yum install -y jq）"
  exit 1
fi

ENTRIES=$(jq '.entries | length' "$JOURNAL")
if [ "$ENTRIES" -eq 0 ]; then
  echo "❌ ${JOURNAL} 没有 entries，可能 db:generate 没生成成功"
  exit 1
fi

INIT_TAG=$(jq -r '.entries[0].tag' "$JOURNAL")
INIT_WHEN=$(jq -r '.entries[0].when' "$JOURNAL")
INIT_SQL="db/migrations/${INIT_TAG}.sql"

if [ ! -f "$INIT_SQL" ]; then
  echo "❌ 找不到对应 sql 文件 ${INIT_SQL}"
  exit 1
fi

# drizzle-kit 计算 hash 的方式：sha256(sql_content_with_---statement-breakpoint---)
# 这里直接用 sha256sum 算
INIT_HASH=$(sha256sum "$INIT_SQL" | awk '{print $1}')

echo "==> 基线信息"
echo "    tag:   ${INIT_TAG}"
echo "    when:  ${INIT_WHEN}"
echo "    hash:  ${INIT_HASH}"
echo "    sql:   ${INIT_SQL}"
echo ""

# 检查容器
if ! docker compose ps postgres | grep -q healthy; then
  echo "❌ postgres 容器不在 healthy 状态，先 docker compose up -d postgres"
  exit 1
fi

# 检查表是否已存在
EXISTS=$(docker compose exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" postgres \
  psql -h 127.0.0.1 -U studio_bei -d studio_bei -tAc \
  "SELECT to_regclass('drizzle.__drizzle_migrations')")

if [ "$EXISTS" = "drizzle.__drizzle_migrations" ]; then
  COUNT=$(docker compose exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" postgres \
    psql -h 127.0.0.1 -U studio_bei -d studio_bei -tAc \
    "SELECT count(*) FROM drizzle.__drizzle_migrations")
  echo "ℹ️  drizzle.__drizzle_migrations 表已存在，当前 ${COUNT} 行"
  if [ "$COUNT" -gt 0 ]; then
    echo "    已经有迁移历史，不再插入基线（避免覆盖）。"
    echo "    如果你确定要重置，请先手工清空：DELETE FROM drizzle.__drizzle_migrations;"
    exit 0
  fi
fi

echo "==> 标记 ${INIT_TAG} 为已应用"
docker compose exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" postgres \
  psql -h 127.0.0.1 -U studio_bei -d studio_bei -v ON_ERROR_STOP=1 <<SQL
CREATE SCHEMA IF NOT EXISTS drizzle;
CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);
INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
VALUES ('${INIT_HASH}', ${INIT_WHEN});
SQL

echo "==> 完成 ✅"
echo ""
echo "下一步：从此每次 schema 变更："
echo "  1. 本地 pnpm db:generate   （产出 0001_xxx.sql）"
echo "  2. git add db/migrations && git commit && push"
echo "  3. CI 绿后 deploy 自动跑 drizzle-kit migrate"
