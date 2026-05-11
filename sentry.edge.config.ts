/**
 * Sentry · Edge runtime（proxy.ts 等）。
 *
 * 本项目 proxy.ts 只看 cookie，逻辑极简，sample 设小一点节省 events。
 */
import * as Sentry from "@sentry/nextjs";

const DSN = process.env.SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn: DSN,
    sendDefaultPii: false,
    environment: process.env.APP_ENV ?? process.env.NODE_ENV ?? "development",
    release: process.env.APP_VERSION,

    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,
  });
}
