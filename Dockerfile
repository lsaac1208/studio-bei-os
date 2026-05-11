# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────
# Studio Bei OS · 多阶段镜像 · 基于 node:22-alpine
# - deps: 装依赖（含 devDeps，供 build 用）
# - builder: 跑 next build，输出 .next/standalone
# - migrator: 跟 builder 共享，专门跑 drizzle-kit push
# - runner: 仅含 standalone + node_modules 子集，最小运行时
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

# ============= Stage 2: builder =============
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

RUN pnpm build

# ============= Stage 3: migrator =============
# 用于跑 drizzle-kit push，需要完整 node_modules + db/* + drizzle.config.ts
FROM builder AS migrator
WORKDIR /app
ENV NODE_ENV=production
CMD ["./node_modules/.bin/drizzle-kit", "push", "--force"]

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
