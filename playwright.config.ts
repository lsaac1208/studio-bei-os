import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright 配置。
 *
 * 默认对线上 https://100yse.com 跑（不依赖本地 dev server）。
 * 切到本地：E2E_BASE_URL=http://localhost:3000 pnpm test:e2e
 *
 * 两类项目：
 *  1. 公开烟测（chromium-desktop / chromium-mobile）
 *     - smoke.spec.ts：未登录路径 + API 鉴权 gate
 *     - 生产 + localhost 都跑
 *  2. admin 后台 mutation（admin-desktop，需 storage state）
 *     - 仅在 allowWrite 环境启用（localhost / E2E_ALLOW_WRITE=1）
 *     - 依赖 auth.setup.ts 先登录并存 tests/.auth/admin.json
 */
const baseURL = process.env.E2E_BASE_URL ?? "https://100yse.com";
const allowWrite = process.env.E2E_ALLOW_WRITE === "1" || /localhost|127\.0\.0\.1/.test(baseURL);

const ADMIN_STORAGE = "tests/.auth/admin.json";

// admin 相关的 spec / setup 模式
const ADMIN_SETUP_PATTERN = /auth\.setup\.ts$/;
const ADMIN_SPEC_PATTERN = /admin\.spec\.ts$/;

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
    // ── 公开烟测：跳过 admin.spec 和 setup ──
    {
      name: "chromium-desktop",
      testIgnore: [ADMIN_SETUP_PATTERN, ADMIN_SPEC_PATTERN],
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "chromium-mobile",
      testIgnore: [ADMIN_SETUP_PATTERN, ADMIN_SPEC_PATTERN],
      use: { ...devices["Pixel 7"] },
    },
    // ── admin：仅在 allowWrite 时追加 setup + admin 项目 ──
    ...(allowWrite
      ? [
          {
            name: "admin-setup",
            testMatch: ADMIN_SETUP_PATTERN,
          },
          {
            name: "admin-desktop",
            testMatch: ADMIN_SPEC_PATTERN,
            use: {
              ...devices["Desktop Chrome"],
              viewport: { width: 1280, height: 800 },
              storageState: ADMIN_STORAGE,
            },
            dependencies: ["admin-setup"],
          },
        ]
      : []),
  ],
});
