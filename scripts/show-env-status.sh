#!/usr/bin/env bash
# Studio Bei OS · 展示 .env 当前状态 (敏感字段 mask)
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then echo "no .env"; exit 1; fi

echo "=== .env 关键变量 (敏感字段已 mask) ==="

mask_or_show() {
  local key="$1"
  local val="$2"
  local secret="$3"  # 1=mask, 0=show
  if [ -z "$val" ]; then
    echo "  $key = (empty)"
  elif [ "$secret" = "1" ]; then
    local len=${#val}
    local first="${val:0:4}"
    local last="${val: -2}"
    echo "  $key = ${first}...${last}  ($len chars)"
  else
    echo "  $key = $val"
  fi
}

while IFS='=' read -r key rest; do
  # 跳过注释和空行
  [[ "$key" =~ ^# ]] && continue
  [[ -z "$key" ]] && continue
  # 去掉两端引号
  val="${rest%\"}"; val="${val#\"}"

  case "$key" in
    POSTGRES_PASSWORD|BETTER_AUTH_SECRET|FEISHU_APP_SECRET|FEISHU_VERIFICATION_TOKEN|FEISHU_ENCRYPT_KEY|BLOB_READ_WRITE_TOKEN|ADMIN_INITIAL_PASSWORD)
      mask_or_show "$key" "$val" 1 ;;
    DATABASE_URL|BETTER_AUTH_URL|NEXT_PUBLIC_SITE_URL|FEISHU_REDIRECT_URI|FEISHU_APP_ID|ADMIN_EMAIL|ADMIN_LARK_OPEN_ID)
      mask_or_show "$key" "$val" 0 ;;
  esac
done < .env
