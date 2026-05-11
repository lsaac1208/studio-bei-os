# Contributing — Studio Bei OS

## 分支策略

- `main`：可发布分支，受 CI 保护
- 功能分支：`feat/<short-name>`、`fix/<short-name>`、`chore/<short-name>`、`docs/<short-name>`
- **不要直接 push 到 `main`**，通过 PR 合并

## Commit 信息约定（Conventional Commits）

```
<type>(<scope>): <subject>

[可选 body]
[可选 footer，如 Closes #123]
```

`type` 允许：`feat` | `fix` | `chore` | `docs` | `refactor` | `test` | `perf` | `build` | `ci`

示例：

```
feat(bitable): 增量 pull 回写 status / priority
fix(leads): 归档按钮在已归档线索上重复触发的问题
chore(deps): bump next 16.2.5 → 16.3.0
```

## PR 流程

1. 在 issue 上 `Assign yourself`，把 Project 卡拖到 *In Progress*
2. 本地 `git switch -c feat/xxx`
3. 写代码、跑：
   ```powershell
   pnpm typecheck
   pnpm check          # biome 自动修复
   pnpm build
   pnpm test:e2e       # 本地起 server + postgres 后跑
   ```
4. 提交、push、开 PR，描述用模板
5. CI 全绿 + 至少 1 个 reviewer approve → squash merge
6. 合并后 Project 卡自动跳到 *Done*（已用 Actions 自动化）

## 数据库 schema 改动

1. 改 `db/schema.ts`
2. 本地 `pnpm db:push` 验证
3. PR 描述里贴 `drizzle-kit push` 的输出（哪些 ALTER）
4. 合到 `main` 后部署流程会自动跑 migrator

## .env 改动

任何新增的 env 变量都要：
- 加到 `.env.example`（带注释说明）
- 在 PR 描述里说明 *谁去补*（你自己 / 运维）

## Release

- 暂用 ECS rsync 部署，不打 tag
- 后续如需版本化，建议 `v<major>.<minor>.<patch>`
