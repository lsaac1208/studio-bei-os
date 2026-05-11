#!/usr/bin/env bash
# Studio Bei OS · 在服务器上配置首个 admin
# 1. 在 .env 里设置 ADMIN_EMAIL / ADMIN_INITIAL_PASSWORD（如果还没设）
# 2. 跑 docker compose --profile seed run --rm seed 创建 admin user
# 3. 打开 settings.auth.allowPasswordFallback (临时启用应急通道)
set -euo pipefail
cd "$(dirname "$0")/.."

# ── 0. 校验 .env ──
if [ ! -f .env ]; then
  echo "✗ 缺 .env，先 bash scripts/setup-env.sh"
  exit 1
fi

# ── 1. 输入或读取 ADMIN_EMAIL ──
CURRENT_EMAIL=$(grep "^ADMIN_EMAIL=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
if [ -z "$CURRENT_EMAIL" ] || [ "$CURRENT_EMAIL" = "you@example.com" ]; then
  read -rp "请输入管理员邮箱: " ADMIN_EMAIL_INPUT
  ADMIN_EMAIL_INPUT=$(echo "$ADMIN_EMAIL_INPUT" | tr -d ' ')
  if [ -z "$ADMIN_EMAIL_INPUT" ]; then
    echo "✗ 邮箱不能为空"
    exit 1
  fi
  if grep -q "^ADMIN_EMAIL=" .env; then
    sed -i "s|^ADMIN_EMAIL=.*|ADMIN_EMAIL=\"$ADMIN_EMAIL_INPUT\"|" .env
  else
    echo "ADMIN_EMAIL=\"$ADMIN_EMAIL_INPUT\"" >> .env
  fi
  echo "✓ ADMIN_EMAIL 已写入 .env"
else
  echo "  使用现有 ADMIN_EMAIL: $CURRENT_EMAIL"
fi

# ── 2. 生成或保留 ADMIN_INITIAL_PASSWORD ──
CURRENT_PWD=$(grep "^ADMIN_INITIAL_PASSWORD=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
if [ -z "$CURRENT_PWD" ]; then
  ADMIN_PWD=$(openssl rand -base64 18 | tr -d '/+=\n' | head -c 16)
  ADMIN_PWD="${ADMIN_PWD}-Sb1"  # 加点固定字符确保 ≥12 字符
  if grep -q "^ADMIN_INITIAL_PASSWORD=" .env; then
    sed -i "s|^ADMIN_INITIAL_PASSWORD=.*|ADMIN_INITIAL_PASSWORD=\"$ADMIN_PWD\"|" .env
  else
    echo "ADMIN_INITIAL_PASSWORD=\"$ADMIN_PWD\"" >> .env
  fi
  echo ""
  echo "  ┌──────────────────────────────────────────────────────┐"
  echo "  │  生成的应急密码（请立即保存到密码管理器！）：        │"
  echo "  │                                                      │"
  printf "  │    %-50s│\n" "$ADMIN_PWD"
  echo "  │                                                      │"
  echo "  │  之后用此密码 + ADMIN_EMAIL 登录 /admin/login        │"
  echo "  └──────────────────────────────────────────────────────┘"
  echo ""
else
  echo "  ADMIN_INITIAL_PASSWORD 已存在 (.env 中)，保持不变"
fi

# ── 3. 跑 seed ──
echo ""
echo "==> 跑 docker compose --profile seed run --rm seed"
docker compose --profile seed run --rm seed

# ── 4. 启用应急密码登录的 UI 开关 ──
echo ""
echo "==> 启用 settings.auth.allowPasswordFallback (让 /admin/login 显示密码表单)"
docker compose exec -T postgres psql -U studio_bei -d studio_bei -c \
  "INSERT INTO settings (key, value) VALUES ('auth.allowPasswordFallback', 'true') ON CONFLICT (key) DO UPDATE SET value = 'true', updated_at = now();"

echo ""
echo "==> done"
echo ""
echo "下一步："
echo "  1. 浏览器访问 https://100yse.com/admin/login"
echo "  2. 看到飞书按钮 + '使用应急密码登录' 链接"
echo "  3. 点链接 → 用 ADMIN_EMAIL + 上面的密码登录"
echo "  4. 成功跳到 /admin dashboard"
echo "  5. 飞书 OAuth 配好后，建议把应急密码关掉："
echo "     docker compose exec -T postgres psql -U studio_bei -d studio_bei -c \\"
echo "       \"UPDATE settings SET value = 'false' WHERE key = 'auth.allowPasswordFallback';\""
