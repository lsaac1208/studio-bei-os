#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Studio Bei OS · 在 ECS 上跑的部署脚本
# 用法：
#   ssh root@100yse.com "cd /opt/studio-bei-os && bash scripts/deploy.sh"
# 或本地：
#   ssh -i KEY root@HOST "cd /opt/studio-bei-os && bash scripts/deploy.sh"
# ─────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")/.."

step() { echo ""; echo "==> $*"; }

step "0/5 检查 .env"
if [ ! -f .env ]; then
  echo "❌ 缺 .env 文件。先 cp .env.example .env 并填好密码"
  exit 1
fi
# 校验必需变量
for v in POSTGRES_PASSWORD BETTER_AUTH_SECRET; do
  if ! grep -qE "^$v=.+" .env; then
    echo "❌ .env 缺 $v"
    exit 1
  fi
done

step "1/5 git pull (如果是 git 部署)"
if [ -d .git ]; then
  git pull --ff-only || echo "git pull 失败，跳过"
fi

step "2/5 构建 app + migrator 镜像"
# 注意：必须同时 build migrate，否则 schema 改动后 migrator 用旧 schema.ts，
# drizzle-kit push 会错误地报告 "no changes detected"
docker compose build app
docker compose --profile migrate build migrate

step "3/5 启动数据库（如未起）"
docker compose up -d postgres
echo "等待 postgres healthy..."
for i in {1..30}; do
  if docker compose ps postgres | grep -q healthy; then
    echo "  postgres healthy"
    break
  fi
  sleep 2
done

step "4/5 同步 schema (drizzle-kit push)"
docker compose --profile migrate run --rm migrate

step "5/5 启动/重启 app"
docker compose up -d app

echo ""
echo "==> 部署完成"
docker compose ps
echo ""
echo "下一步："
echo "  - sudo ln -s \$PWD/deploy/nginx/100yse.com.conf /etc/nginx/sites-available/100yse.com  (首次)"
echo "  - sudo ln -s /etc/nginx/sites-available/100yse.com /etc/nginx/sites-enabled/  (首次)"
echo "  - sudo nginx -t && sudo systemctl reload nginx"
echo "  - sudo certbot --nginx -d 100yse.com -d www.100yse.com  (首次)"
echo "  - 测试：curl -I http://100yse.com"
echo ""
echo "v2.0 升级（仅首次执行一次，按 slug 幂等）："
echo "  - docker compose --profile seed-cases run --rm seed-cases  # 注入 3 个初始作品案例"
echo "  - 然后进 https://100yse.com/admin/cases 补完封面 / 图集"
