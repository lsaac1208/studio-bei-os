#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Bitable 双向同步：触发 /api/cron/bitable-sync。
# 由 systemd timer 每 5 min 调用一次；也可手动 bash scripts/run-bitable-sync.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

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
  "http://localhost:13001/api/cron/bitable-sync"
