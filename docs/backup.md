# DB 备份与恢复

> 每天 04:30 (Asia/Shanghai) 自动 `pg_dump`。
> 实现：`scripts/backup-db.sh` + `deploy/systemd/studio-bei-backup-db.{service,timer}`

脚本三档自适应，**默认零配置就能跑**：

| 模式 | env 配置 | 输出 | 适合 |
|---|---|---|---|
| **A · 本地裸 gzip** | 啥都不配 | `/var/backups/studio-bei/*.sql.gz` | **默认、零配置**；快速跑起来 |
| **B · 加密本地** | `BACKUP_ENCRYPT_PASSPHRASE` | `*.sql.gz.enc` | 想加密但还没接 OSS |
| **C · 加密 + OSS** | 上面 + `BACKUP_OSS_BUCKET` + `BACKUP_OSS_ENDPOINT` | 本地 `*.enc` + OSS 副本 | 防 ECS 整盘丢失的生产标配 |

所有模式都会**自动清理本地 7 天前的旧备份**（可通过 `BACKUP_LOCAL_KEEP_DAYS` 调）。

---

## 模式 A · 零配置部署（推荐先做这一步）

**4 行命令搞定**：

```bash
ssh root@100yse.com
cd /opt/studio-bei-os
sudo bash deploy/systemd/install.sh       # 装 timer
sudo systemctl start studio-bei-backup-db.service   # 立刻跑一次验证
sudo journalctl -u studio-bei-backup-db.service -n 50 --no-pager
```

期望日志末尾：
```
==> [...] 开始备份
    模式: A：裸 gzip 本地（无加密；建议未来加 passphrase）
    输出: /var/backups/studio-bei/studio-bei-20260512-043022.sql.gz
    大小: 1.2MB
==> [...] 备份完成
ℹ️  本地最近 5 个备份：
    -rw-r--r-- 1 root root 1.2M May 12 04:30 studio-bei-...sql.gz
```

到这里你已经有可靠的本地日备份了。**模式 A 的风险**：

- ✅ 防意外删表 / schema bug / push --force 倒车 / 误改数据
- ❌ 不防 ECS 整机坏盘（Aliyun ECS ESSD 本身有冗余存储，损坏概率极低但非零）
- ❌ 文件明文，能 SSH 上 ECS 的人能读

**如果你接受这两个风险**，模式 A 就够用了，下面的 B / C 可以无限期推迟。

---

## 模式 B · 升级到加密本地（5 分钟）

```bash
# 1) 生成口令
openssl rand -base64 48

# 2) 加进 /opt/studio-bei-os/.env
echo 'BACKUP_ENCRYPT_PASSPHRASE="刚才的输出"' >> /opt/studio-bei-os/.env

# 3) ⚠️ 把口令另存到 1Password / Bitwarden / 任何密码管理器
#    丢了 = 加密备份永远解不开

# 4) 立刻跑一次验证模式切换
sudo systemctl start studio-bei-backup-db.service
sudo journalctl -u studio-bei-backup-db.service -n 30 --no-pager
# 应该看到 "模式: B：加密本地"，文件名后缀变成 .sql.gz.enc
```

旧的 `.sql.gz` 还会留在原目录直到 7 天保留期满，期间二者共存不冲突。

---

## 模式 C · 升级到 OSS 异地副本（一次性约 15 分钟）

这一步**真正能解决"ECS 整机丢失"**。但需要阿里云控制台操作。

### C-1. 创建 OSS bucket

阿里云控制台 → OSS → 创建 Bucket：

- **名称**：`studio-bei-backup`（全局唯一，记下来）
- **区域**：与 ECS 同区（华东 2 上海）— 走内网免流量费
- **存储类型**：标准（恢复时不要等解冻）
- **读写权限**：**私有** ✓ 必选
- **服务端加密**：建议开 OSS 完全托管

进 bucket → 基础设置 → 生命周期 → 创建规则：
- 规则名：`autodelete-7d`
- 应用前缀：`studio-bei-os/`
- 过期天数：**7 天**（与本地保留策略一致）

### C-2. 配 ossutil 凭证（两种方式选一）

**方式 1（推荐）· ECS 绑 RAM 角色**

RAM 控制台 → 角色 → 创建：
- 可信实体类型：**阿里云服务**
- 受信服务：**云服务器 ECS**
- 角色名：`studio-bei-backup-role`

给角色加权限策略（自定义 JSON）：
```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["oss:PutObject", "oss:GetObject", "oss:ListObjects"],
      "Resource": [
        "acs:oss:*:*:studio-bei-backup",
        "acs:oss:*:*:studio-bei-backup/studio-bei-os/*"
      ]
    }
  ]
}
```

ECS 控制台 → 实例 → 实例 RAM 角色 → 绑定 `studio-bei-backup-role`。

SSH 到 ECS 验证：
```bash
ossutil ls oss://studio-bei-backup/ --endpoint oss-cn-shanghai-internal.aliyuncs.com
# 列空但不报错 = 凭证 OK
```

**方式 2 · 交互式 access key**（不推荐，key 落盘）

```bash
ossutil config
# 按提示填 AccessKeyId / AccessKeySecret / endpoint
```

### C-3. 写入 .env

```bash
cat >> /opt/studio-bei-os/.env <<'EOF'
BACKUP_OSS_BUCKET="studio-bei-backup"
BACKUP_OSS_ENDPOINT="oss-cn-shanghai-internal.aliyuncs.com"
EOF
```

注意：模式 C 必须先有 `BACKUP_ENCRYPT_PASSPHRASE`（模式 B 那一步）— 脚本会拒绝"不加密就上 OSS"的配置组合，避免明文外泄。

### C-4. 验证

```bash
sudo systemctl start studio-bei-backup-db.service
sudo journalctl -u studio-bei-backup-db.service -n 30 --no-pager
# 应该看到 "模式: C：加密 + OSS"，末尾打印 oss:// 路径
```

到阿里云 OSS 控制台确认文件存在，大小与本地一致。

### C-5. 演练恢复（强烈建议）

灾难时第一次试恢复是赌博。**至少完整 dry-run 一遍**：

```bash
# 本地另起一个 docker postgres 做靶子（或新建 ECS 测试机）
bash scripts/restore-db.sh oss://studio-bei-backup/studio-bei-os/studio-bei-<stamp>.sql.gz.enc
```

---

## 日常运维

| 任务 | 命令 |
|---|---|
| 看 timer 调度 | `systemctl list-timers studio-bei-*` |
| 看下次跑的时间 | `systemctl status studio-bei-backup-db.timer` |
| 看最近一次备份日志 | `journalctl -u studio-bei-backup-db.service -n 100` |
| 立即跑一次 | `sudo systemctl start studio-bei-backup-db.service` |
| 暂停备份 | `sudo systemctl stop studio-bei-backup-db.timer` |
| 列本地备份 | `ls -lhrt /var/backups/studio-bei/` |

---

## 灾难恢复

```bash
# 1) 停 app（避免读到半灌状态）
docker compose stop app

# 2) restore（脚本按文件后缀自动判断是否解密；要求回车确认）
#    模式 A：
bash scripts/restore-db.sh /var/backups/studio-bei/studio-bei-<stamp>.sql.gz
#    模式 B/C 本地：
bash scripts/restore-db.sh /var/backups/studio-bei/studio-bei-<stamp>.sql.gz.enc
#    模式 C 从 OSS（适用于 ECS 整盘丢失时新机器恢复）：
bash scripts/restore-db.sh oss://studio-bei-backup/studio-bei-os/studio-bei-<stamp>.sql.gz.enc

# 3) 起 app
docker compose start app

# 4) 验证
curl -s https://100yse.com/api/health | jq    # ok:true & db:up
```

---

## 监控建议（可选）

- **轻量**：UptimeRobot 加 keyword monitor，看 `/api/health` 的 `timestamp` 是否仍在更新
- **正经**：cron 加一条「24h 内没有新备份文件就发飞书告警」的检查脚本

## 已知限制

- 流式上传不能续传 — 中断需重跑整个流程（数据量小通常 < 5s 不是问题）
- 模式 A 不防 ECS 整机故障；模式 C 才有异地副本
- 没做异地多副本。需要更长归档可加 OSS 第二条 lifecycle 规则把超 7 天的转 IA / 归档 / Glacier
