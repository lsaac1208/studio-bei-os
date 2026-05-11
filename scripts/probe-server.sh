#!/usr/bin/env bash
# Studio Bei OS · 服务器现状探查 · 只读，不改任何东西
# 用法（在本地）：cat scripts/probe-server.sh | ssh -i KEY root@HOST 'bash -s'

set +e

section() { echo ""; echo "=== $* ==="; }

section "OS / KERNEL"
cat /etc/os-release 2>/dev/null | grep -E '^(NAME|VERSION|PRETTY_NAME|VERSION_CODENAME)='
uname -a

section "RESOURCES"
echo "CPU cores: $(nproc 2>/dev/null)"
free -h 2>/dev/null | head -2
df -h / 2>/dev/null | tail -1
echo "Free space breakdown:"
df -h 2>/dev/null | grep -vE '(tmpfs|devtmpfs|udev|overlay|loop)' | head -10

section "NETWORK / TIMEZONE"
ip -4 addr show 2>/dev/null | grep -E 'inet ' | grep -v 127.0.0.1 | awk '{print "  iface " $NF " | ip " $2}'
echo "Current time: $(date)"
timedatectl 2>/dev/null | grep -E '(Time zone|Local time)' | head -2

section "INSTALLED SOFTWARE"
for cmd in node npm pnpm yarn corepack git nginx psql postgres pg_isready pm2 docker certbot ufw curl wget htop fail2ban-client; do
  if command -v "$cmd" >/dev/null 2>&1; then
    v=$("$cmd" --version 2>&1 | head -1 | tr -d '\n' | cut -c1-80)
    echo "  OK $cmd | $v"
  else
    echo "  -- $cmd not installed"
  fi
done

section "POSTGRES STATUS"
if systemctl list-units --type=service --all 2>/dev/null | grep -qi postgres; then
  systemctl status postgresql --no-pager 2>/dev/null | head -8
else
  echo "no postgresql service detected"
fi

section "NODE / NGINX SERVICES"
systemctl is-active nginx 2>/dev/null && echo "nginx: active" || echo "nginx: inactive/missing"
systemctl is-active node 2>/dev/null && echo "node: active" || echo "node service: missing"

section "LISTENING PORTS"
(ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null) | head -25

section "FIREWALL"
if command -v ufw >/dev/null 2>&1; then
  echo "[ufw status]"
  ufw status 2>/dev/null | head -15
fi
if systemctl is-active firewalld >/dev/null 2>&1; then
  echo "[firewalld active]"
  firewall-cmd --list-all 2>/dev/null | head -15
fi
echo "[iptables INPUT - first 10 rules]"
iptables -L INPUT -n 2>/dev/null | head -12

section "SELINUX"
getenforce 2>/dev/null || echo "no selinux"

section "USER / SUDO"
id
echo "Sudo: $(sudo -n true 2>/dev/null && echo yes || echo no/passwd)"

section "DONE"
echo "probe complete at $(date)"
