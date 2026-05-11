#!/usr/bin/env bash
# Studio Bei OS · 启动 postgres + migrate + app · 本机验证
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> 1/4 启动 postgres"
docker compose up -d postgres

echo "  等 postgres healthy ..."
for i in $(seq 1 30); do
  status=$(docker inspect -f '{{.State.Health.Status}}' studio-bei-postgres 2>/dev/null || echo "starting")
  if [ "$status" = "healthy" ]; then
    echo "  ✓ postgres healthy ($i 次)"
    break
  fi
  if [ "$i" = "30" ]; then
    echo "  ✗ postgres 30 次仍未 healthy，看日志:"
    docker compose logs postgres | tail -30
    exit 1
  fi
  sleep 2
done

echo ""
echo "==> 2/4 跑 migrate (drizzle-kit push --force)"
docker compose --profile migrate run --rm migrate

echo ""
echo "==> 3/4 启动 app"
docker compose up -d app

echo "  等 app 起来 ..."
sleep 5
for i in $(seq 1 15); do
  if curl -sf -o /dev/null http://127.0.0.1:13001/ 2>/dev/null; then
    echo "  ✓ app 响应 ($i 次)"
    break
  fi
  if [ "$i" = "15" ]; then
    echo "  ✗ app 15 次仍无响应，看日志:"
    docker compose logs app | tail -30
    exit 1
  fi
  sleep 2
done

echo ""
echo "==> 4/4 状态汇报"
docker compose ps
echo ""
echo "--- HTTP 测试 ---"
for path in / /contact; do
  curl -sI -o /dev/null -w "$path  HTTP=%{http_code}  time=%{time_total}s\n" "http://127.0.0.1:13001$path"
done

echo ""
echo "==> 数据库表清单"
docker compose exec -T postgres psql -U studio_bei -d studio_bei -c "\dt"

echo ""
echo "==> done"
