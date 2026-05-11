#!/usr/bin/env bash
# Studio Bei OS · 在低内存 ECS 上加 2GB swap
# 幂等：检测到已有 swap 则跳过
set -euo pipefail

if swapon --show | grep -q '/swapfile'; then
  echo "  /swapfile 已存在，跳过创建"
  swapon --show
  free -h
  exit 0
fi

echo "==> 创建 2GB swapfile (/swapfile)"
fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

echo "==> 持久化到 /etc/fstab"
if ! grep -q '/swapfile' /etc/fstab; then
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "  ✓ /etc/fstab 已添加"
else
  echo "  /etc/fstab 已有条目"
fi

echo "==> 调优 swap 参数"
# vm.swappiness=10：仅当物理内存严重紧张时才 swap，避免常态走 swap 拖慢
# vm.vfs_cache_pressure=50：保留更多文件缓存
sysctl vm.swappiness=10 >/dev/null
sysctl vm.vfs_cache_pressure=50 >/dev/null
if ! grep -q 'vm.swappiness' /etc/sysctl.conf; then
  echo 'vm.swappiness=10' >> /etc/sysctl.conf
  echo 'vm.vfs_cache_pressure=50' >> /etc/sysctl.conf
fi

echo ""
echo "==> done"
swapon --show
free -h
