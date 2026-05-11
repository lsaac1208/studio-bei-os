#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# 在 ECS 上一次性手工触发飞书播报（用于 Smoke / 手动测试）。
# 用法：bash scripts/test-cron-briefing.sh [daily|weekly]
# 默认 daily。
# ─────────────────────────────────────────────────────────────
set -euo pipefail

TYPE="${1:-daily}"
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "缺 .env"
  exit 1
fi
# shellcheck disable=SC1091
set -a
source .env
set +a

if [ -z "${CRON_SECRET:-}" ]; then
  echo "缺 CRON_SECRET"
  exit 1
fi

curl -sS -X POST \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "http://localhost:13001/api/cron/briefing/${TYPE}"
echo
