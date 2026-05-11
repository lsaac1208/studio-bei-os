# Sentry 错误监控

> 把所有未捕获异常 / 服务端 5xx / React 渲染崩溃 / 路由错误自动上送 Sentry。
> 实现：`@sentry/nextjs` + 4 个 init 文件 + `next.config.ts` 包裹 + Dockerfile 注入构建期 token。
>
> **DSN 留空时整个集成是 no-op**——本地 dev 不需要 Sentry 也能跑。

---

## 数据流

```
浏览器 (instrumentation-client.ts)
  ├─ 客户端 JS 错误 → Sentry SaaS
  ├─ Replay only on error（free tier 友好，maskAllText/blockAllMedia 隐私默认）
  └─ Router transition tracing → Sentry SaaS

Next.js Node runtime (sentry.server.config.ts via instrumentation.ts register())
  ├─ Route Handler 抛错 → onRequestError → Sentry
  ├─ Server Action 抛错 → 同上
  └─ 透 captureException 主动上报

Edge runtime (sentry.edge.config.ts)
  └─ proxy.ts 出错 → Sentry

构建期：withSentryConfig 把 .map 上传到 Sentry，再删本地（不打进镜像）
```

---

## 首次接入清单

### 1. 创建 Sentry 项目

1. https://sentry.io/signup → 注册（免费版 5k events / 月）
2. **Create Project**：
   - Platform: **Next.js**
   - Alert frequency: 默认（Issue 出现立即邮件）
   - Project name: `studio-bei-os`（默认即可）
3. 创建后会跳到一个 onboarding 页，**记下 DSN**（形如 `https://xxxxx@oXXXXX.ingest.sentry.io/XXXXX`）
4. **Settings → Auth Tokens → Create New Token**：
   - Scopes: `project:releases` + `org:read`（最小集，用于 source map 上传）
   - 复制 token（格式 `sntrys_xxxxxxxxx`）

### 2. 在生产 ECS 的 `.env` 写入

```bash
ssh root@100yse.com
cd /opt/studio-bei-os
# 编辑 .env，加上：
SENTRY_DSN="https://xxxxx@oXXXXX.ingest.sentry.io/XXXXX"
NEXT_PUBLIC_SENTRY_DSN="https://xxxxx@oXXXXX.ingest.sentry.io/XXXXX"
SENTRY_ORG="<你的 org slug>"
SENTRY_PROJECT="studio-bei-os"
# SENTRY_AUTH_TOKEN 不要写在 .env 里（避免落盘）；走 GH secret 更安全
```

> **DSN 不是秘密**（公开 ingest 端点 + 项目 ID），会被打进 client bundle 给浏览器用，写 `.env` 没问题。
> **AUTH_TOKEN 是秘密**（能改你的 sentry org），优先走 GitHub Secret。

### 3. 配置 GitHub secret

仓库 → **Settings → Secrets and variables → Actions → New repository secret**：

| Name | Value |
|---|---|
| `SENTRY_AUTH_TOKEN` | 上一步拿到的 `sntrys_xxxxxxxxx` |

`.github/workflows/deploy.yml` 已配好把它透到 SSH 远端，再交给 docker build。

### 4. 安装依赖（首次接入）

本地：
```bash
pnpm install   # 拉 @sentry/nextjs
git add package.json pnpm-lock.yaml
git commit -m "chore: add @sentry/nextjs"
git push
```

CI 会自动 `pnpm install --frozen-lockfile`，所以 lockfile 必须同步提交。

### 5. 触发一次部署 + 验证

```bash
# 推一个空 commit 触发 deploy
git commit --allow-empty -m "chore: trigger deploy with sentry"
git push
```

部署完成后：
- 访问 `https://100yse.com/api/health` → `version` 字段是当次 git SHA
- 在 Sentry 项目页 → **Issues**，应该能看到部署事件（Sentry 会自动从 source map 上传判定 release）

### 6. 触发一次真实错误验证管道

任选其一：

**方式 A：Server 侧**
```bash
# 临时给 /api/health 加一行 throw 看是否上报，然后回滚
```

**方式 B：客户端侧** — 浏览器 console 里直接：
```js
throw new Error('Sentry test from console')
```

预期：Sentry 项目 Issues 列表出现一条 `Error: Sentry test`，stack trace 解析到具体源码行（说明 source map 工作）。

---

## 隐私设置（默认已配）

- `sendDefaultPii: false` — **不上报** IP / cookie / Authorization header
- `replayIntegration({ maskAllText: true, blockAllMedia: true })` — Replay 自动遮罩所有文本和媒体
- `replaysSessionSampleRate: 0` — 默认不录 session，只在出错时录最近 30 秒
- `ignoreErrors: ['ChunkLoadError', ...]` — 屏蔽部署期常见噪声

如果你愿意为调试效果换更多 PII，把 `sendDefaultPii` 改 true。**不建议**：你的 leads 表本来就有 PII，多一处暴露面无意义。

---

## 关闭 / 调整

| 想做 | 做法 |
|---|---|
| 临时停 Sentry（不删配置） | 把 `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` 留空，重启 app |
| 调采样率（省 events） | 改 `sentry.{server,edge}.config.ts` 和 `instrumentation-client.ts` 里的 `tracesSampleRate` |
| 完全卸载 | 删 4 个 init 文件 + `app/global-error.tsx` + 还原 `next.config.ts` + `pnpm remove @sentry/nextjs` |

---

## 已知坑

- **`/sentry-tunnel` 路径**：被 `tunnelRoute` 选项启用了，让 Sentry 流量走自家域名绕开广告插件拦截。这个路径是 Sentry SDK 的内置路由，**不要**在你的 `app/` 下创建同名页面。
- **`NEXT_PUBLIC_SENTRY_DSN` 必须在构建时设**：Next.js 把所有 `NEXT_PUBLIC_*` 编译进 client bundle，构建后再改 env 不会生效。docker-compose 的 build.args 已处理这点。
- **source map 不进镜像**：`sourcemaps.deleteSourcemapsAfterUpload: true` 已开，runner 阶段没有 .map 文件，避免把源码泄露到生产镜像。
