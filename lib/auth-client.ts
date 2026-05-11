"use client";

import { genericOAuthClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * 浏览器侧 better-auth 客户端。
 * - signIn.oauth2({ providerId: "feishu" })  → 飞书 OAuth 跳转
 * - signIn.email({ email, password })        → 应急密码登录
 * - signOut()                                → 登出
 * - useSession()                             → 客户端订阅会话
 */
export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  plugins: [genericOAuthClient()],
});

export const { signIn, signOut, useSession } = authClient;
