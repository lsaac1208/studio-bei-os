/**
 * Sentry · 浏览器侧初始化（Next 16 instrumentation-client.ts 模式）。
 *
 * - DSN 未配置时直接 no-op，本地 dev 不打 Sentry
 * - sendDefaultPii=false：本项目存客户线索（PII），不要自动上报 IP / cookie / header
 * - tracesSampleRate 生产 0.1：free tier 5k events/月，留余量
 * - replays 仅在错误时录（free tier 友好）
 */
import * as Sentry from "@sentry/nextjs";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn: DSN,
    sendDefaultPii: false,
    environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV ?? "development",
    release: process.env.NEXT_PUBLIC_APP_VERSION,

    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // session replay：默认不录，仅在 error 时录最近 30s
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // 部署期常见噪声：deploy 后浏览器拿不到旧 chunk
    ignoreErrors: [
      "ChunkLoadError",
      "Loading chunk",
      "Loading CSS chunk",
      // Safari extension 噪声
      /^TypeError: cancelled$/,
      /^TypeError: NetworkError when attempting to fetch resource/,
    ],
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
