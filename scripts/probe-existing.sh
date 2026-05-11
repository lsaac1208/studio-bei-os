#!/usr/bin/env bash
# Studio Bei OS · 第二轮探查 · 现有跑着的服务 · 只读
set +e

section() { echo ""; echo "=== $* ==="; }

section "NGINX CONFIG"
echo "[main config test]"
nginx -t 2>&1
echo ""
echo "[sites-enabled list]"
ls -la /etc/nginx/sites-enabled/ 2>/dev/null
ls -la /etc/nginx/conf.d/ 2>/dev/null
echo ""
echo "[server_name overview]"
grep -rhE '^[[:space:]]*server_name[[:space:]]+' /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null | sed 's/;.*//' | sort -u

section "NGINX VHOST CONTENT (first 60 lines per file)"
for f in /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf; do
  if [ -f "$f" ]; then
    echo ""
    echo "----- FILE: $f -----"
    head -60 "$f"
  fi
done

section "LETSENCRYPT CERTS"
if [ -d /etc/letsencrypt/live ]; then
  ls /etc/letsencrypt/live/ 2>/dev/null
  echo ""
  echo "[per-domain expiry]"
  for dir in /etc/letsencrypt/live/*/; do
    domain=$(basename "$dir")
    [ "$domain" = "README" ] && continue
    cert="$dir/cert.pem"
    if [ -f "$cert" ]; then
      expires=$(openssl x509 -in "$cert" -noout -enddate 2>/dev/null | cut -d= -f2)
      echo "  $domain | expires: $expires"
    fi
  done
else
  echo "no /etc/letsencrypt/live"
fi

section "PM2 CURRENT PROCESSES"
pm2 list 2>/dev/null
echo ""
echo "[PM2 jlist - exec path / cwd / port]"
if command -v jq >/dev/null 2>&1; then
  pm2 jlist 2>/dev/null | jq -r '.[] | "  - \(.name) | exec=\(.pm2_env.pm_exec_path // "?") | cwd=\(.pm2_env.pm_cwd // "?") | port=\(.pm2_env.PORT // "?")"' 2>/dev/null
else
  pm2 jlist 2>/dev/null | tr ',' '\n' | grep -E '"(name|pm_exec_path|pm_cwd|PORT)"' | head -40
fi

section "DOCKER CONTAINERS"
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}' 2>/dev/null

section "SYSTEMD WEB SERVICES"
systemctl list-units --type=service --state=running --no-pager 2>/dev/null | grep -E '(nginx|node|pm2|docker|postgres|redis|mysql)' | head -10

section "/var/www and /opt content"
ls -la /var/www 2>/dev/null
ls -la /opt 2>/dev/null | head -20
ls -la /home 2>/dev/null | head -10

section "SWAP STATUS"
swapon --show 2>/dev/null || echo "no swap configured"
free -h 2>/dev/null | grep -i swap

section "DONE"
echo "probe2 complete at $(date)"
