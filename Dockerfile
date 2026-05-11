# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────
# Studio Bei OS · 多阶段镜像 · 基于 node:22-alpine
# - deps: 装依赖（含 devDeps，供 build 用）
# - migrator: 跑 drizzle-kit migrate（依赖 deps 的 node_modules + 源码）
# - builder: 跑 next build，输出 .next/standalone
# - runner: 仅含 standalone + node_modules 子集，最小运行时
#
# Stage 顺序对 classic docker builder 至关重要：必须把 migrator 放在 builder 之前，
# 否则 build target=migrator 会重跑 pnpm build。详见 Stage 2 注释。
# ─────────────────────────────────────────────────────────────

# ============= Stage 1: deps =============
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 启用 pnpm
RUN corepack enable && corepack prepare pnpm@10 --activate

# 复制依赖清单（lockfile 必须）
COPY package.json pnpm-lock.yaml ./

# 低内存 ECS 防 OOM：限制 child 并发 + 限制 node old-space
ENV NODE_OPTIONS="--max-old-space-size=512"
RUN pnpm install --frozen-lockfile --prefer-offline --child-concurrency=1

# ============= Stage 2: migrator =============
# 跑 drizzle-kit migrate / seed*.ts。轻量级，只需 node_modules + 源码。
#
# 为什么放在 builder 之前？
#   ECS 用 classic docker builder（无 BuildKit），build target=migrator 时会
#   **顺序构建 Dockerfile 中此 target 之前的所有 stage**（忽略实际 FROM 依赖）。
#   若 migrator 在 builder 之后，build migrate 会重跑一遍 `pnpm build`，浪费 ~10 min
#   并触发 OOM 风险。把 migrator 放 builder 前面：build migrate 只跑 deps→migrator。
#   build app（target=runner）则跑 deps→migrator→builder→runner，多 1 个轻量 layer
#   （~30s），但 runner 无 migrator 依赖，最终镜像大小不变。
#
# 首次切到本流程前，必须用 scripts/baseline-migrations.sh 把现有 DB 标记为 0000_init 已应用
# 详见 docs/migrations.md
FROM node:22-alpine AS migrator
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10 --activate
COPY --from=deps /app/node_modules ./node_modules
# 源码全量拷（dockerignore 排除 .next / node_modules / .git 等）；
# seed*.ts 引用 @/lib/* 需要 tsconfig + lib/，所以全拷最稳
COPY . .
ENV NODE_ENV=production
CMD ["./node_modules/.bin/drizzle-kit", "migrate"]

# ============= Stage 3: builder =============
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建期不需要真实数据库，给 dummy 即可
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="postgres://dummy:dummy@localhost:5432/dummy"
ENV BETTER_AUTH_SECRET="builder-dummy-secret-32-chars-min-needed-here"
ENV BETTER_AUTH_URL="http://localhost:3000"

# 低内存 ECS 防 OOM：限制 next build webpack 内存上限 768MB
ENV NODE_OPTIONS="--max-old-space-size=768"

# Sentry 构建期变量（withSentryConfig 用）：
#  - SENTRY_AUTH_TOKEN：上传 source map 到 sentry.io，仅构建期需要，**不进 runner**
#  - NEXT_PUBLIC_*：会被 next 内联进客户端 bundle，必须构建期可见
ARG SENTRY_AUTH_TOKEN=""
ARG SENTRY_ORG=""
ARG SENTRY_PROJECT=""
ARG NEXT_PUBLIC_SENTRY_DSN=""
ARG NEXT_PUBLIC_APP_VERSION="dev"
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN \
    SENTRY_ORG=$SENTRY_ORG \
    SENTRY_PROJECT=$SENTRY_PROJECT \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
    NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION

RUN pnpm build

# ============= Stage 4: runner =============
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 非 root 用户
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# 仅复制 standalone 必需产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
