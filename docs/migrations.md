# DB 迁移流程

> 从此告别 `drizzle-kit push --force`，改用版本化迁移文件。
> 工具：drizzle-kit + `db/migrations/*.sql` + `drizzle.__drizzle_migrations` 表。

---

## 为什么要这么改

之前每次部署用 `drizzle-kit push --force` 同步生产 DB schema：

| 风险 | 表现 |
|---|---|
| **无版本** | 没有 `0001_xxx.sql` 之类的文件，看不出每次部署做了什么 schema 变化 |
| **无历史** | 不知道哪次 commit 改了哪张表的哪个字段 |
| **`--force`** | 列被删掉/改类型 → push 直接生效，可能丢数据 |
| **不可回滚** | 没有 down migration |

改后：
- 每次 schema 改动产出 `0001_xxx.sql` 等文件，**进 git，可 review**
- 生产用 `drizzle-kit migrate`（不是 push），按 `db/migrations/meta/_journal.json` 顺序应用
- DB 里 `drizzle.__drizzle_migrations` 表记录哪些 hash 已应用，幂等

---

## 一次性切换流程

> 现有生产 DB 是用 push --force 弄出来的，没有迁移历史。我们要把它"标记"为已应用 0000_init。

### 步骤 1：本地生成 0000_init

```bash
# 先确保 .env.local 里 DATABASE_URL 是本地 dev DB（不是生产）
cd /Volumes/时光鸡/Mycode/studio-bei-os
pnpm install                  # 确保 drizzle-kit 装好
pnpm db:generate --name init  # 产出 db/migrations/0000_init.sql + meta/_journal.json
```

预期产物：
```
db/migrations/
├── 0000_init.sql            # 全部 11 张表的 CREATE
└── meta/
    ├── _journal.json        # { entries: [{ idx:0, tag:"0000_init", hash:"...", when:... }] }
    └── 0000_snapshot.json   # 当前 schema 的完整快照
```

### 步骤 2：本地 dev DB 验证（可选但推荐）

把本地 dev DB 清空 + 重新跑全套迁移确认无误：

```bash
# 仅在本地 dev DB 上跑，绝对不要点错到生产
pnpm db:migrate
```

如果这步过了，0000_init.sql 是对的。

### 步骤 3：commit + push

```bash
git add db/migrations
git commit -m "chore(db): freeze current schema as 0000_init migration"
git push
```

CI 此时会跑 `drizzle-kit push --force`（旧 docker-compose）/ `drizzle-kit migrate`（新的）⚠️

⚠️ **暂时不要让 deploy 跑！** 我们还没在生产 DB 里建 baseline 表。
如果不小心跑了 deploy，新 docker 镜像会用 `drizzle-kit migrate` 命令——它看到没有 baseline 表，会想从 0000 开始全跑，但 schema 已经存在 → ERROR，部署失败但数据无损。可以接着做步骤 4 再重试。

### 步骤 4：在 ECS 上跑 baseline 脚本（一次性）

```bash
ssh root@100yse.com
cd /opt/studio-bei-os
git pull   # 或 rsync 已带过来
# 装 jq（如果没装）
apt-get install -y jq

bash scripts/baseline-migrations.sh
```

预期输出：
```
==> 基线信息
    tag:   0000_init
    when:  1747...
    hash:  e3b0c44298fc1c149afb...
==> 标记 0000_init 为已应用
==> 完成 ✅
```

去 DB 里确认：
```sql
SELECT * FROM drizzle.__drizzle_migrations;
-- 1 行：(1, '<hash>', <when>)
```

### 步骤 5：触发一次部署，确认 migrator 行为

push 一个空 commit 触发 deploy：
```bash
git commit --allow-empty -m "chore: trigger deploy after baseline"
git push
```

deploy 流程到 step 4 时：
```
==> 同步 schema (drizzle-kit migrate)
[migrator] No new migrations to apply
==> step 4 完成
```

如果看到 `No new migrations to apply`，**切换成功 ✅**。

---

## 日常流程（步骤 6 之后）

每次改 `db/schema.ts`：

```bash
# 本地：
pnpm db:generate --name <短描述>   # 例：pnpm db:generate --name add_lead_tags
# 看一眼 db/migrations/0001_add_lead_tags.sql 是不是符合预期
# 在本地 dev DB 跑一下确认
pnpm db:migrate

# 没问题了，commit
git add db/migrations
git commit -m "feat(db): add tags column to leads"
git push

# CI 绿 → deploy 自动 migrate ✅
```

---

## 常见情况

### 我改了 schema，但 generate 出来的 sql 不对劲怎么办？

删掉刚生成的 `db/migrations/000X_*.sql` 和 `db/migrations/meta/000X_snapshot.json`，再调整 `db/schema.ts`，重新 `pnpm db:generate`。**只要还没 push 到生产**，怎么改都安全。

### 部署到一半 migrate 失败了怎么办？

drizzle-kit 用事务包裹每个迁移文件，要么全成要么全失败回滚。
查日志：
```bash
docker compose logs migrate --tail=100
```
修好 schema.ts → 重新 generate → 覆盖原 0001 文件（注意 hash 会变，需要把 `__drizzle_migrations__` 里那行删了重 baseline）→ 重新部署。

### 我想回滚某次迁移怎么办？

drizzle-kit **不生成 down migration**。如果要回滚，需要：
1. 写一个**新的迁移文件**（0002_revert_xxx.sql）做反向操作
2. 或者从 OSS 备份 restore 整个 DB（见 `docs/backup.md`）

第 2 种 90% 时候更安全。

### 不小心忘了 baseline，部署起来发现 migrator 想 CREATE TABLE 但表已存在

这就是步骤 4 漏跑的症状。补救：
1. 立即按步骤 4 跑 baseline 脚本
2. 然后手动 `docker compose --profile migrate run --rm migrate` 重试
3. 看到 `No new migrations to apply` 即回到正常

---

## 文件位置一览

| 文件 | 说明 |
|---|---|
| `db/schema.ts` | 真理来源（drizzle 模型定义） |
| `db/migrations/0000_init.sql` | 初始全量建表 |
| `db/migrations/000X_*.sql` | 增量变更 |
| `db/migrations/meta/_journal.json` | drizzle-kit 维护的迁移列表 |
| `db/migrations/meta/000X_snapshot.json` | 每次 generate 时的 schema 快照 |
| `scripts/baseline-migrations.sh` | 一次性把现有 DB 标记为已应用 |
| `Dockerfile` migrator stage | 跑 `drizzle-kit migrate` |
| `docker-compose.yml` migrate profile | `docker compose --profile migrate run --rm migrate` |
| `scripts/deploy.sh` step 4 | deploy 时自动执行 migrate |
