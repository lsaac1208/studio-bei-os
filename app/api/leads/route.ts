import { type NextRequest, NextResponse } from "next/server";
import { insertLead } from "@/lib/leads";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";
import { leadCreateSchema } from "@/lib/validators";

/**
 * 公开线索提交接口。
 * - 限流：单 IP 每 10 分钟 5 次
 * - 校验：Zod
 * - 反垃圾：honeypot 字段 `website` 必须为空
 * - 入库：leads + leadActivities (CREATE)
 * - 飞书通知由 M8 监听 leadCreated 事件触发，这里只负责落库
 */
export async function POST(req: NextRequest) {
  const ip = clientIpFromHeaders(req.headers);
  const userAgent = req.headers.get("user-agent") ?? undefined;
  const referer = req.headers.get("referer") ?? undefined;

  // 限流（rateLimit 现在是 async：Upstash 有配走 Redis，否则内存 fallback）
  const limited = await rateLimit(`leads:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "提交太频繁，请稍后再试。" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((limited.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  // 解析 body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "请求格式错误。" }, { status: 400 });
  }

  // Zod 校验
  const parsed = leadCreateSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0]?.toString();
      if (path && !fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return NextResponse.json(
      { ok: false, error: "表单校验未通过。", fields: fieldErrors },
      { status: 400 },
    );
  }

  // honeypot：bot 会填，真人看不到
  if (parsed.data.website) {
    // 静默假装成功，避免 bot 知道被识破
    return NextResponse.json({ ok: true, code: "SB-IGNORE" });
  }

  // 入库
  try {
    const lead = await insertLead(parsed.data, { ip, userAgent, referer });
    return NextResponse.json({ ok: true, code: lead.code, id: lead.id });
  } catch (err) {
    console.error("[/api/leads] insert failed", err);
    return NextResponse.json(
      { ok: false, error: "服务器开了个小差，请稍后再试或微信联系。" },
      { status: 500 },
    );
  }
}
