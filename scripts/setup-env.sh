#!/usr/bin/env bash
# Studio Bei OS · 首次部署生成 .env (强随机密码)
# 幂等：如果 .env 已存在则跳过
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -f .env ]; then
  echo "  .env 已存在，跳过生成（如需重置请先删除 .env）"
  exit 0
fi

cp .env.example .env

PG_PASS=$(openssl rand -hex 16)
AUTH_SECRET=$(openssl rand -hex 32)

sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$PG_PASS|" .env
sed -i "s|^BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=$AUTH_SECRET|" .env
sed -i "s|^BETTER_AUTH_URL=.*|BETTER_AUTH_URL=https://100yse.com|" .env
sed -i "s|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=https://100yse.com|" .env
sed -i "s|^FEISHU_REDIRECT_URI=.*|FEISHU_REDIRECT_URI=https://100yse.com/api/auth/callback/feishu|" .env

chmod 600 .env

echo "✓ .env 生成完毕 (mode 600)"
