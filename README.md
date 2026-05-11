# Studio Bei OS

> 一人 freelance 工作室自用的「营销前台 + 获客 CRM + 内容 CMS」一体化系统。
> 配套文档：`../beta02/docs/studio-bei-os-prd.md`、`../beta02/docs/studio-bei-os-tech.md`。

## 技术栈

- **Next.js 16**（App Router · Turbopack）+ **React 19**
- **TypeScript 5**（strict）
- **Tailwind CSS v4**（CSS-first，`@theme` 主题）+ **shadcn/ui**（手动 infra，stone 调色板）
- **Drizzle ORM** + **Postgres 17**（开发：本地 / 生产：阿里云 ECS Docker）
- **Better Auth** + **飞书 OAuth**（`genericOAuth` 插件）+ 应急密码通道
- **飞书 `@larksuiteoapi/node-sdk`** + 自定义机器人 / 交互式卡片
- **TanStack Query v5** · **React Hook Form + Zod** · **TipTap v2** · **Motion** · **Sonner**
- **Vercel Blob** 文件存储 · **next-intl** 国际化预留 · **next-view-transitions** 页面过场
- **Biome** 代码检查 + 格式化（替代 ESLint + Prettier）

## 目录结构

```
studio-bei-os/
├── app/
│   ├── api/
│   │   └── auth/[...all]/route.ts   # Better Auth 总入口
│   ├── admin/                       # 后台（M5+）
│   ├── layout.tsx
│   ├── page.tsx                     # 首页占位
│   ├── globals.css                  # Tailwind v4 + 主题
│   └── not-found.tsx
├── actions/                         # Server Actions（M7 / M9 实装）
├── components/                      # ui / marketing / admin / cases（M2+）
├── db/
│   ├── client.ts                    # drizzle(neon(URL))
│   ├── schema.ts                    # 表定义
│   ├── seed.ts                      # 初始管理员 + 默认 settings
│   └── migrations/                  # drizzle-kit 产出
├── lib/
│   ├── auth.ts                      # Better Auth 实例
│   ├── validators.ts                # Zod schemas
│   ├── settings.ts                  # settings 表读写 helper
│   ├── rate-limit.ts                # 内存版（v1）
│   ├── blob.ts                      # Vercel Blob 上传
│   ├── utils.ts                     # cn() helper
│   └── feishu/                      # client / cards / bot / verify
├── proxy.ts                         # /admin/* cookie 鉴权（Next 16 替代 middleware.ts）
├── drizzle.config.ts
├── biome.json
├── components.json                  # shadcn 配置
├── tsconfig.json
├── postcss.config.mjs               # Tailwind v4
├── next.config.ts
└── package.json
```

## 本地开发

### M0 账号准备（首次启动前）

1. **飞书开放平台**（https://open.feishu.cn/app）：建「企业自建应用」→ 拿 `App ID` / `App Secret` / 验签 Token；重定向 URL 暂填 `http://localhost:3000/api/auth/callback/feishu`。
2. **Neon**（https://neon.tech）：建 project → 拿 `DATABASE_URL`（带 `?sslmode=require`）。
3. **Vercel Blob**（部署后再配，本地可暂留空）。

### 环境变量

```bash
cp .env.example .env.local
# 用真实值填写
```

### 启动

```bash
pnpm install                  # 已自带 .pnpmfile
pnpm db:push                  # 把 schema 直接 push 到 Neon（首跑）
pnpm db:seed                  # 写入初始管理员 + 默认 settings
pnpm dev                      # http://localhost:3000
```

### 常用命令

| 命令              | 用途                                       |
| ----------------- | ------------------------------------------ |
| `pnpm dev`        | Next dev（Turbopack）                       |
| `pnpm build`      | 生产构建                                   |
| `pnpm start`      | 生产启动                                   |
| `pnpm typecheck`  | tsc --noEmit                               |
| `pnpm lint`       | Biome lint                                 |
| `pnpm format`     | Biome 格式化（自动 fix）                    |
| `pnpm check`      | Biome lint + format + organize imports     |
| `pnpm ci`         | Biome 严格检查（CI 用）                     |
| `pnpm db:generate`| 根据 schema 生成迁移文件                     |
| `pnpm db:migrate` | 运行待执行的迁移                            |
| `pnpm db:push`    | 把 schema 直接同步到 DB（开发期方便）         |
| `pnpm db:studio`  | 打开 Drizzle Studio（DB 可视化）              |
| `pnpm db:seed`    | 跑 db/seed.ts                              |
| `pnpm test:e2e`   | Playwright 冒烟（默认打 prod 100yse.com）     |
| `pnpm test:e2e:ui`| Playwright UI 模式                          |

## 端到端冒烟（Playwright）

覆盖关键路径：
- 公开页：首页、`/contact`、`/api/content/faq`
- 后台鉴权：`/admin`、`/admin/leads|faqs|settings` 未登录跳 `/admin/login`
- 飞书：`/api/feishu/callback` 处理 `url_verification`
- 完整链路：首页 → `/contact` → 提交 → `/thanks` 显示 `SB-YYYY-XXXXXX` 编号
  - **仅在 baseURL 为 localhost 时跑**（避免污染生产 leads 表）
  - 强制跑生产：`E2E_ALLOW_WRITE=1 pnpm test:e2e`

切换目标（PowerShell）：
```powershell
$env:E2E_BASE_URL="http://localhost:3000"; pnpm test:e2e
```
bash / zsh：
```bash
E2E_BASE_URL=http://localhost:3000 pnpm test:e2e
```

桌面 + 移动两套 device 配置（Pixel 7），共 20 项；生产环境下 18 通过 + 2 跳过。

## 部署

**栈**：阿里云 ECS（`100yse.com`）+ Docker 多阶段镜像 + `docker compose` + 宿主 Nginx → `127.0.0.1:13001` + 本机 `postgres:17-alpine` 容器（独立 volume）。

**触发**：`git push` → GitHub Actions → CI 绿 → `deploy.yml` rsync → ECS `docker compose up -d`。

### 最小路径（零额外账号 / 密钥）

只要 `.env` 里填好 **🔴 必填** 那一段（`POSTGRES_PASSWORD` / `BETTER_AUTH_SECRET` / `ADMIN_EMAIL` 等），剩下全部 ⚪ 可跳：

| 模块 | 不配的效果 |
|---|---|
| Sentry | 整集成 no-op，错误只能 `docker logs` 看 |
| Upstash Redis | 自动 fallback 进程内内存（单实例无差别） |
| Aliyun OSS 备份 | DB 备份仍跑，本地 `/var/backups/studio-bei/` 裸 gzip，保留 7 天 |
| Vercel Blob | cases 模块的图片上传禁用（旧图正常显示） |

部署完跑一次：

```bash
ssh root@100yse.com
cd /opt/studio-bei-os
sudo bash deploy/systemd/install.sh                # 装备份 + 飞书 cron timer
sudo systemctl start studio-bei-backup-db.service  # 立刻跑一次备份验证
sudo nginx -t && sudo systemctl reload nginx       # 应用安全 headers
bash scripts/baseline-migrations.sh                # 把现有 DB 标记为已应用首次 migration
curl -s https://100yse.com/api/health | jq         # ok:true & db:up
```

### Day-2 升级路径

按需查阅，可随时单独启用：

- **DB 备份升级到加密 / OSS 异地副本** → `@docs/backup.md`
- **schema 迁移**（生成、应用、回滚） → `@docs/migrations.md`
- **Sentry 错误监控** → `@docs/sentry.md`

## 里程碑（详见 tech doc §14）

- [x] **M0** — 账号准备
- [x] **M1** — 项目骨架 + 工具链 + 基础 lib / db / actions
- [x] **M2** — 首页 + TrustStrip + Services / Pricing / Process / Fit
- [x] **M3** — 三个案例交互组件（phone / kanban / sparkline / lead board）
- [x] **M4** — 需求表单 + `/api/leads` + 感谢页
- [x] **M5** — Better Auth + 飞书 OAuth + 登录页
- [x] **M6** — 后台 Dashboard + 线索列表 + 看板
- [x] **M7** — 线索详情 + Server Actions + 时间线
- [x] **M8** — 飞书机器人 + 交互卡片 + 卡片回调
- [x] **M9** — FAQ 管理 + 站点设置（联系方式 / 飞书通知）
- [x] **M10** — 响应式打磨 + Playwright 冒烟 + 部署上线
- [x] **v2.0** — 作品案例 CMS（DB 表 + 后台增删改 + TipTap 富文本 + 封面/图集上传 + 公开 `/cases` 与 `/cases/[slug]`）

## 与 beta02 的关系

`../beta02/` 是设计原型（纯 HTML/CSS/JS，零依赖），**保留只读**。本仓库迁入其设计语言、案例交互、文案；不直接复用代码。

