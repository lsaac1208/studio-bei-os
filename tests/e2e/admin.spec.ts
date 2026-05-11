import { expect, test } from "@playwright/test";

/**
 * admin 已登录路径冒烟：
 *  - 各 /admin/* 页都能穿过 requireAdmin 渲染（200，不跳 login）
 *  - /api/admin/leads/export 返回 CSV
 *
 * 登录态来自 `auth.setup.ts` 产出的 `tests/.auth/admin.json`，由 playwright.config.ts
 * 的 admin-* project 通过 `storageState` 注入到 browser context。
 *
 * 仅在 allowWrite 环境下由 project 启用；prod baseURL 下该文件根本不会被执行。
 */

test.describe("admin 渲染 + 鉴权穿透", () => {
  test("/admin 已登录 → 200 + 不跳 login", async ({ page }) => {
    const res = await page.goto("/admin", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    expect(page.url()).not.toContain("/login");
    // 顶栏或内容里至少出现一个后台关键词
    await expect(page.locator("body")).toContainText(/Studio Bei|线索|待办|FAQ|案例|Dashboard/i);
  });

  const pages = [
    { url: "/admin/leads", name: "线索列表" },
    { url: "/admin/leads/kanban", name: "线索看板" },
    { url: "/admin/todos", name: "待办" },
    { url: "/admin/faqs", name: "FAQ" },
    { url: "/admin/settings", name: "设置" },
    { url: "/admin/cases", name: "案例" },
    { url: "/admin/landing", name: "首页内容" },
  ];

  for (const { url, name } of pages) {
    test(`${url}（${name}）已登录 → 200`, async ({ page }) => {
      const res = await page.goto(url, { waitUntil: "domcontentloaded" });
      // 某些 next 路由可能返回 204/308，接受任何 <400
      expect(res?.status()).toBeLessThan(400);
      expect(page.url()).not.toContain("/login");
      expect(page.url()).not.toContain("/forbidden");
    });
  }

  test("/api/admin/leads/export 已登录 → 200 + CSV 头", async ({ request }) => {
    const res = await request.get("/api/admin/leads/export");
    expect(res.status()).toBe(200);
    const ct = res.headers()["content-type"] ?? "";
    // 接受 text/csv、application/csv、text/plain 等
    expect(ct).toMatch(/csv|text\/plain/i);
  });
});
