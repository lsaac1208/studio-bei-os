#!/usr/bin/env bash
# Studio Bei OS · 安装 nginx vhost + 申请 HTTPS 证书
set -euo pipefail
cd "$(dirname "$0")/.."

VHOST_SRC="$PWD/deploy/nginx/100yse.com.conf"
VHOST_AVAIL="/etc/nginx/sites-available/100yse.com"
VHOST_ENABLED="/etc/nginx/sites-enabled/100yse.com"

echo "==> 1/5 软链 vhost 到 sites-available"
if [ -L "$VHOST_AVAIL" ] || [ -f "$VHOST_AVAIL" ]; then
  echo "  $VHOST_AVAIL 已存在 (覆盖软链)"
  rm -f "$VHOST_AVAIL"
fi
ln -s "$VHOST_SRC" "$VHOST_AVAIL"

echo "==> 2/5 启用 vhost (sites-enabled)"
if [ -L "$VHOST_ENABLED" ] || [ -f "$VHOST_ENABLED" ]; then
  echo "  $VHOST_ENABLED 已存在 (覆盖)"
  rm -f "$VHOST_ENABLED"
fi
ln -s "$VHOST_AVAIL" "$VHOST_ENABLED"

echo "==> 3/5 nginx -t 验证"
nginx -t

echo "==> 4/5 reload nginx"
systemctl reload nginx

echo "  --- HTTP (80) 测试 ---"
sleep 1
curl -sI -o /dev/null -w "  http://100yse.com/        HTTP=%{http_code}  via=%{redirect_url:--}\n" -H "Host: 100yse.com" http://127.0.0.1/
curl -sI -o /dev/null -w "  http://www.100yse.com/    HTTP=%{http_code}\n" -H "Host: www.100yse.com" http://127.0.0.1/

echo ""
echo "==> 5/5 certbot 申请 HTTPS 证书 (双域名)"
certbot --nginx -d 100yse.com -d www.100yse.com --non-interactive --agree-tos --redirect

echo ""
echo "==> 完成校验"
echo "  --- HTTPS 测试 ---"
sleep 1
curl -skI -o /dev/null -w "  https://100yse.com/         HTTP=%{http_code}\n" https://100yse.com/
curl -skI -o /dev/null -w "  https://www.100yse.com/     HTTP=%{http_code}\n" https://www.100yse.com/
curl -skI -o /dev/null -w "  https://100yse.com/contact  HTTP=%{http_code}\n" https://100yse.com/contact

echo ""
echo "==> 证书状态"
certbot certificates 2>&1 | grep -E "Certificate Name|Domains|Expiry|VALID" | head -20

echo ""
echo "==> done"
