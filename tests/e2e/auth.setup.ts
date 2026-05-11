import path from "node:path";
import { test as setup } from "@playwright/test";

/**
 * 管理员登录 + 保存 storage state，给后续 `admin.spec.ts` 复用。
 *
 * 走 Better Auth 的 REST 端点 `/api/auth/sign-in/email`，不依赖 UI 表单。
 * 这样不用关心 `auth.allowPasswordFallback` 设置是否为 true。
 *
 * 只在 "允许写" 环境下跑：
 *  - E2E_BASE_URL 指向 localhost/127.0.0.1
 *  - 或 E2E_ALLOW_WRITE=1 显式授权
 * 由 playwright.config.ts 的 project 条件化启用来兜底。
 *
 * 账号来自 env（默认用 CI 的 dummy 值，方便本地 pnpm test:e2e 也能跑）：
 *  - ADMIN_EMAIL
 *  - ADMIN_INITIAL_PASSWORD   ≥ 12 字符（better-auth.emailAndPassword.minPasswordLength）
 */
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "ci@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD ?? "ci-only-password";

// 相对 repo root；admin 项目 storageState 同样这么指
export const ADMIN_STORAGE = path.join("tests", ".auth", "admin.json");

setup("admin 登录 + 保存 storage state", async ({ request }) => {
  const res = await request.post("/api/auth/sign-in/email", {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    failOnStatusCode: false,
  });
  if (!res.ok()) {
    const body = await res.text().catch(() => "<empty>");
    throw new Error(
      `admin 登录失败 (${res.status()})：${body}\n` +
        "检查 ADMIN_EMAIL / ADMIN_INITIAL_PASSWORD 是否已 seed，" +
        "以及 Better Auth emailAndPassword 是否启用。",
    );
  }
  await request.storageState({ path: ADMIN_STORAGE });
});
