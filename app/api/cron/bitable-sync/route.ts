import { NextResponse } from "next/server";
import { runBitableSync } from "@/lib/feishu/bitable-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/cron/bitable-sync
 *
 * 由 systemd timer 每 5 分钟触发一次：
 *  - 把还没推过 bitable / 同步老于 1h 的 lead 推上去（自愈）
 *  - 拉 bitable 上 last_modified 过的记录，回写 status / priority 到本地
 *
 * 鉴权：Authorization: Bearer ${CRON_SECRET}（与 briefing 共用同一 secret）。
 *
 * 同样支持 GET，便于 curl 调试。
 */
async function handle(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET not configured on server" },
      { status: 503 },
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (provided.length !== expected.length || provided !== expected) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const r = await runBitableSync();
    return NextResponse.json(r);
  } catch (err) {
    console.error("[cron/bitable-sync] failed", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export const POST = handle;
export const GET = handle;
