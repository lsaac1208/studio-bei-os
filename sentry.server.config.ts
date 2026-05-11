/**
 * Sentry · Node.js 运行时（Server Components / Route Handlers / Server Actions）。
 *
 * 由 instrumentation.ts 动态 import；DSN 未设则 no-op。
 */
import * as Sentry from "@sentry/nextjs";

const DSN = process.env.SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn: DSN,
    sendDefaultPii: false,
    environment: process.env.APP_ENV ?? process.env.NODE_ENV ?? "development",
    release: process.env.APP_VERSION,

    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // 标准库的预期错误不打 Sentry（rate-limit 命中、Zod 校验失败等）
    ignoreErrors: ["ZodError"],
  });
}
