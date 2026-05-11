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
# Sentry 构建期变量（DSN / ORG / PROJECT 从 .env 读；TOKEN 从 SSH env 读）
# 显式 export 确保 docker compose 能读到（即便 .env 里漏配也能从 shell 兜住）
export SENTRY_AUTH_TOKEN="${SENTRY_AUTH_TOKEN:-}"
export APP_VERSION="${DEPLOY_SHA:-dev}"

# 注意：必须同时 build migrate，否则 schema 改动后 migrator 用旧 schema.ts，
# drizzle-kit push 会错误地报告 "no changes detected"
docker compose build app
docker compose --profile migrate build migrate

# 额外用 git SHA 给 app 镜像打 tag，方便回滚（DEPLOY_SHA 由 deploy.yml SSH 注入）
# 回滚命令示例：
#   docker tag studio-bei-os:<旧SHA> studio-bei-os:latest && docker compose up -d app
if [ -n "${DEPLOY_SHA:-}" ]; then
  docker tag studio-bei-os:latest "studio-bei-os:${DEPLOY_SHA}"
  echo "  → 已打 tag: studio-bei-os:${DEPLOY_SHA}"
  # 仅保留最近 10 个 SHA-tag（按创建时间），其余删除（不影响 latest）
  docker images --format '{{.Repository}}:{{.Tag}} {{.CreatedAt}}' \
    | awk '$1 ~ /^studio-bei-os:[0-9a-f]{7,40}$/ {print $0}' \
    | sort -k2 -r \
    | tail -n +11 \
    | awk '{print $1}' \
    | xargs -r docker rmi 2>/dev/null || true
fi

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

step "4/5 同步 schema (drizzle-kit migrate)"
# 按 db/migrations/*.sql 顺序应用；首次切此流程前必须先跑 baseline-migrations.sh
# 详见 docs/migrations.md
docker compose --profile migrate run --rm migrate

step "5/5 启动/重启 app"
# 把 DEPLOY_SHA 透成 APP_VERSION 给容器，供 /api/health 暴露
export APP_VERSION="${DEPLOY_SHA:-dev}"
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
