import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright 配置 — 关键路径冒烟测试。
 *
 * 默认对线上 https://100yse.com 跑（不依赖本地 dev server）。
 * 切到本地：E2E_BASE_URL=http://localhost:3000 pnpm test:e2e
 *
 * 设计原则：
 *   - 只测公开路径与未登录的鉴权重定向；带登录态的 mutation 测试留给后续。
 *   - 慢但稳：每个 test 自带 timeout，不依赖 dev server 启动。
 */
const baseURL = process.env.E2E_BASE_URL ?? "https://100yse.com";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30 * 1000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    locale: "zh-CN",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
