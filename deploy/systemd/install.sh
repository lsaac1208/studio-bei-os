#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# 在 ECS 上安装/更新 systemd timers（飞书播报）。
# 幂等；可以反复运行。
#
# 用法（在 ECS 上 root 权限）：
#   sudo bash /opt/studio-bei-os/deploy/systemd/install.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")"
SRC_DIR="$(pwd)"
DEST_DIR=/etc/systemd/system

UNITS=(
  studio-bei-briefing-daily.service
  studio-bei-briefing-daily.timer
  studio-bei-briefing-weekly.service
  studio-bei-briefing-weekly.timer
  studio-bei-bitable-sync.service
  studio-bei-bitable-sync.timer
  studio-bei-backup-db.service
  studio-bei-backup-db.timer
)

echo "==> 复制 unit 文件到 ${DEST_DIR}"
for u in "${UNITS[@]}"; do
  cp -v "${SRC_DIR}/${u}" "${DEST_DIR}/${u}"
done

echo "==> systemctl daemon-reload"
systemctl daemon-reload

echo "==> 启用 + 立刻开始 timer（不会立刻触发 service，按 OnCalendar/OnBootSec）"
systemctl enable --now studio-bei-briefing-daily.timer
systemctl enable --now studio-bei-briefing-weekly.timer
systemctl enable --now studio-bei-bitable-sync.timer
systemctl enable --now studio-bei-backup-db.timer

echo ""
echo "==> 当前状态"
systemctl list-timers --all | grep studio-bei || true

echo ""
echo "下一步："
echo "  - 立刻手工跑一次备份：systemctl start studio-bei-backup-db.service"
echo "  - 看备份日志：       journalctl -u studio-bei-backup-db.service -n 100"
echo "  - 看 timer：         systemctl list-timers studio-bei-*"
