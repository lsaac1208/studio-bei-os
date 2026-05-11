/**
 * Next.js 16 · 服务器/边缘运行时统一注册入口。
 *
 * - register() 会在每个 runtime 启动时调用一次
 * - 通过 NEXT_RUNTIME 区分加载哪份 sentry config
 * - onRequestError 把 App Router 路由内未捕获的异常上送给 Sentry
 *
 * DSN 未设时 sentry.{server,edge}.config.ts 会自我 no-op，无副作用。
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
