import { expect, test } from "@playwright/test";

/**
 * Studio Bei OS — 关键路径冒烟测试。
 *
 * 这些测试覆盖：
 *   1. 首页可访问 + 包含核心文案
 *   2. 公开 FAQ API 健康
 *   3. /admin/* 未登录访问会被重定向到登录页
 *   4. 公开提交表单全流程：/contact → 提交 → /thanks 显示编号
 *
 * 不测试：
 *   - 后台 mutation（需要登录态，未来引入 storage state 后再加）
 *   - 飞书卡片回调（需要凭证）
 */

test.describe("公开页面", () => {
  test("首页 200 + 标题与核心区块可见", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBe(200);
    // 顶栏 logo
    await expect(page.locator("body")).toContainText(/Studio Bei/i);
    // 应该至少有一个 hero / FAQ / contact 区块文本（用 PRD 里的关键文案兜底）
    await expect(page.locator("body")).toContainText(/把你现在的|常见问题|FAQ|业务流程/);
  });

  test("公开 FAQ API 健康", async ({ request }) => {
    const res = await request.get("/api/content/faq");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(Array.isArray(json.items)).toBe(true);
  });

  test("/contact 表单页可见", async ({ page }) => {
    const res = await page.goto("/contact");
    expect(res?.status()).toBe(200);
    // 至少有一个提交按钮
    await expect(page.getByRole("button", { name: /提交|发送|联系/ })).toBeVisible();
  });
});

test.describe("作品案例公开页", () => {
  test("/cases 列表页 200 + 标题可见", async ({ page }) => {
    const res = await page.goto("/cases");
    expect(res?.status()).toBe(200);
    await expect(page.locator("body")).toContainText(/作品案例|CASES/);
  });

  test("/cases/qiguang-studio 详情页 200 + 标题可见", async ({ page }) => {
    const res = await page.goto("/cases/qiguang-studio");
    // 未发布 / 未 seed 时是 404；环境数据完整时 200
    if (res?.status() === 200) {
      await expect(page.locator("h1").first()).toBeVisible();
      await expect(page.locator("body")).toContainText(/全部案例/);
    } else {
      // 没数据时跳过
      expect([200, 404]).toContain(res?.status());
    }
  });
});

test.describe("后台鉴权", () => {
  test("/admin 未登录 → 跳 /admin/login", async ({ page }) => {
    const res = await page.goto("/admin", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    expect(page.url()).toContain("/admin/login");
  });

  test("/admin/leads 未登录 → 跳 /admin/login", async ({ page }) => {
    await page.goto("/admin/leads", { waitUntil: "domcontentloaded" });
    expect(page.url()).toContain("/admin/login");
  });

  test("/admin/cases 未登录 → 跳 /admin/login", async ({ page }) => {
    await page.goto("/admin/cases", { waitUntil: "domcontentloaded" });
    expect(page.url()).toContain("/admin/login");
  });

  test("/admin/faqs 未登录 → 跳 /admin/login", async ({ page }) => {
    await page.goto("/admin/faqs", { waitUntil: "domcontentloaded" });
    expect(page.url()).toContain("/admin/login");
  });

  test("/admin/settings 未登录 → 跳 /admin/login", async ({ page }) => {
    await page.goto("/admin/settings", { waitUntil: "domcontentloaded" });
    expect(page.url()).toContain("/admin/login");
  });

  test("/admin/todos 未登录 → 跳 /admin/login", async ({ page }) => {
    await page.goto("/admin/todos", { waitUntil: "domcontentloaded" });
    expect(page.url()).toContain("/admin/login");
  });

  test("/admin/landing 未登录 → 跳 /admin/login", async ({ page }) => {
    await page.goto("/admin/landing", { waitUntil: "domcontentloaded" });
    expect(page.url()).toContain("/admin/login");
  });

  test("/admin/search 未登录 → 跳 /admin/login", async ({ page }) => {
    await page.goto("/admin/search?q=test", { waitUntil: "domcontentloaded" });
    expect(page.url()).toContain("/admin/login");
  });

  test("/admin/login 公开可见 (200) + 渲染登录卡片", async ({ page }) => {
    const res = await page.goto("/admin/login");
    expect(res?.status()).toBe(200);
    await expect(page.locator("body")).toContainText(/登录|管理|后台|Studio Bei/);
  });

  test("/api/admin/leads/export 未登录 → 401", async ({ request }) => {
    const res = await request.get("/api/admin/leads/export");
    // 未登录拦截在 route handler 内：返回 401（API 不能 redirect）
    expect(res.status()).toBe(401);
  });
});

test.describe("飞书回调路由", () => {
  test("/api/feishu/callback 处理 url_verification challenge", async ({ request }) => {
    const res = await request.post("/api/feishu/callback", {
      data: { type: "url_verification", challenge: "smoke-test-challenge" },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.challenge).toBe("smoke-test-challenge");
  });
});

test.describe("Cron 飞书播报路由（鉴权）", () => {
  test("/api/cron/briefing/daily 无 Authorization → 401 或 503", async ({ request }) => {
    const res = await request.post("/api/cron/briefing/daily");
    // 401 = 已配 CRON_SECRET 但缺 token；503 = 服务未配 CRON_SECRET
    expect([401, 503]).toContain(res.status());
  });

  test("/api/cron/briefing/daily 错误 token → 401 或 503", async ({ request }) => {
    const res = await request.post("/api/cron/briefing/daily", {
      headers: { authorization: "Bearer wrong-secret-value-for-test" },
    });
    expect([401, 503]).toContain(res.status());
  });

  test("/api/cron/briefing/unknown → 401/503（鉴权先于 type 校验，安全语义）", async ({
    request,
  }) => {
    const res = await request.post("/api/cron/briefing/unknown");
    // 鉴权失败先返回，避免泄露路由是否存在
    expect([401, 503]).toContain(res.status());
  });

  test("/api/cron/bitable-sync 无 Authorization → 401 或 503", async ({ request }) => {
    const res = await request.post("/api/cron/bitable-sync");
    expect([401, 503]).toContain(res.status());
  });

  test("/api/cron/bitable-sync 错误 token → 401 或 503", async ({ request }) => {
    const res = await request.post("/api/cron/bitable-sync", {
      headers: { authorization: "Bearer wrong-secret-value-for-test" },
    });
    expect([401, 503]).toContain(res.status());
  });
});

test.describe("关键路径：完整提交需求表单", () => {
  // 只在非生产环境跑（防止污染真实线索表）
  // 用 E2E_BASE_URL=http://localhost:3000 或显式 E2E_ALLOW_WRITE=1 触发
  const baseURL = process.env.E2E_BASE_URL ?? "https://100yse.com";
  const allowWrite = process.env.E2E_ALLOW_WRITE === "1" || /localhost|127\.0\.0\.1/.test(baseURL);
  test.skip(
    !allowWrite,
    "skip on prod baseURL to avoid leaking E2E data; set E2E_ALLOW_WRITE=1 to force",
  );

  test("访问 / 接触 → /contact 填表 → 提交 → /thanks 显示编号", async ({ page }) => {
    // 步骤 1：从首页进入
    await page.goto("/");
    await expect(page.locator("body")).toContainText(/Studio Bei/i);

    // 步骤 2：直接进 /contact（首页 CTA 链接通常多个，简化用直跳）
    await page.goto("/contact");

    // 步骤 3：填写最小可提交表单
    //   - name + wechat + message 必填
    //   - businessType / budgetRange / timeline 走 form 的 default
    await page.locator('input[name="name"]').fill("E2E 烟测客户");
    await page.locator('input[name="wechat"]').fill("e2e_smoke_user");
    await page
      .locator('textarea[name="message"]')
      .fill("E2E 自动化烟测：这是 Playwright 提交的表单，验证完整链路。请勿真实跟进。");

    // 步骤 4：提交
    const submitBtn = page.getByRole("button", { name: /提交需求|提交|发送/ }).first();
    await submitBtn.click();

    // 步骤 5：等待跳到 /thanks 并显示需求编号
    await page.waitForURL(/\/contact\/thanks/, { timeout: 15_000 });
    // 编号格式 SB-YYYY-XXXXXX
    await expect(page.locator("body")).toContainText(/SB-\d{4}-[A-Z0-9]{6}/);
    // 承诺时限文案
    await expect(page.locator("body")).toContainText(/小时内|工作日内/);
  });
});
