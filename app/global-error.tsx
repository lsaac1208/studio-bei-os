"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * App Router 全局错误边界。
 * - React 渲染期未捕获异常会落到这里
 * - 通过 Sentry.captureException 上送
 * - 自带最小可用兜底 UI（避免空白页）
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center font-sans">
        <h1 className="font-serif text-3xl">系统出了点问题</h1>
        <p className="text-sm text-mute">已自动上报。如果反复出现，请微信联系我或刷新页面再试。</p>
        <a
          href="/"
          className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-accent"
        >
          回到首页
        </a>
      </body>
    </html>
  );
}
