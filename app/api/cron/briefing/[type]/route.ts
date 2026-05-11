import { NextResponse } from "next/server";
import { sendDailyBriefing, sendWeeklyBriefing } from "@/lib/feishu/briefing";

export const runtime = "nodejs";
// 必须每次现算（DB 数据 + 当前时间窗口）
export const dynamic = "force-dynamic";

/**
 * POST /api/cron/briefing/daily
 * POST /api/cron/briefing/weekly
 *
 * 由 ECS 上的 systemd timer / crontab 在北京时间定点触发：
 *   - daily: 每天 9:30
 *   - weekly: 周一 9:00
 *
 * 鉴权：必须带 `Authorization: Bearer ${CRON_SECRET}` header。
 *   - 未配置 CRON_SECRET 时直接 503 拒绝（避免裸奔）
 *
 * 返回 JSON：{ ok, sent, channel?, messageId?, summary }
 *
 * 同样支持 GET（仅当 dev 模式下，便于 curl 测试）。
 */

async function handle(req: Request, ctx: { params: Promise<{ type: string }> }) {
  const { type } = await ctx.params;

  // 鉴权
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET not configured on server" },
      { status: 503 },
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  // 时序无关比较（足够长，不需要 constant-time，但保持显式）
  if (provided.length !== expected.length || provided !== expected) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    switch (type) {
      case "daily": {
        const r = await sendDailyBriefing();
        return NextResponse.json(r);
      }
      case "weekly": {
        const r = await sendWeeklyBriefing();
        return NextResponse.json(r);
      }
      default:
        return NextResponse.json(
          { ok: false, error: `unknown briefing type: ${type}` },
          { status: 400 },
        );
    }
  } catch (err) {
    console.error("[cron/briefing] failed", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export const POST = handle;
export const GET = handle;
