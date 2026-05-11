import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Vitest 配置 — 单元测试（纯函数 / 校验器 / 字符串处理）。
 *
 * E2E 走 Playwright；这里只跑 tests/unit/**.
 *
 * 跑：pnpm test:unit   （watch: pnpm test:unit:watch）
 */
export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    exclude: ["node_modules/**", "tests/e2e/**", ".next/**"],
    environment: "node",
    globals: false,
    reporters: process.env.CI ? ["dot", "github-actions"] : "default",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
