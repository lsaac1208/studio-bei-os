import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 多阶段镜像：将运行时依赖打包进 .next/standalone
  output: "standalone",
  poweredByHeader: false,
  // 反代后真实 IP 通过 X-Forwarded-For 获取
  // 自管 Nginx → 127.0.0.1:13001 → Next.js
  experimental: {
    // serverActions 默认开启，无需配置
  },
};

// 仅当配置了 Sentry DSN 时才包裹，否则原样导出（本地 dev / 未启用 Sentry 的环境零负担）
const enableSentry = Boolean(
  process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
);

export default enableSentry
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      // 上传 source map（需要 SENTRY_AUTH_TOKEN，未设则跳过上传，构建仍成功）
      authToken: process.env.SENTRY_AUTH_TOKEN,
      // 把 Sentry 流量从 /sentry-tunnel 走，绕开广告/隐私插件拦截
      tunnelRoute: "/sentry-tunnel",
      // CI 中正常输出，dev 中静默
      silent: !process.env.CI,
      // 自动扩展 Vercel 监控仪表（我们没用 Vercel，关闭）
      automaticVercelMonitors: false,
      // 删除 source map 以免被打到 standalone 镜像里泄露源码
      sourcemaps: { deleteSourcemapsAfterUpload: true },
    })
  : nextConfig;
