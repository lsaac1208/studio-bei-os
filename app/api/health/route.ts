import "server-only";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";

/**
 * GET /api/health
 *
 * 给外部监活（UptimeRobot / nginx upstream / k8s liveness）用。
 *  - 200 + { ok: true, db: "up" }      → 应用 + DB 都好
 *  - 503 + { ok: false, db: "down" }   → DB 拨号失败（或超 2s）
 *
 * 字段：
 *  - version：APP_VERSION 环境变量，部署时由 deploy.sh 从 git SHA 注入
 *  - uptime ：进程运行秒数（容器重启后归零）
 *
 * 不需要鉴权；不要泄露任何 schema / 路径 / secret。
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APP_VERSION = process.env.APP_VERSION ?? "unknown";
const STARTED_AT = Date.now();
const DB_TIMEOUT_MS = 2000;

async function pingDb(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await Promise.race([
      db.execute(sql`select 1`),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("db ping timeout")), DB_TIMEOUT_MS),
      ),
    ]);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function GET() {
  const result = await pingDb();
  const body = {
    ok: result.ok,
    version: APP_VERSION,
    uptime: Math.floor((Date.now() - STARTED_AT) / 1000),
    timestamp: new Date().toISOString(),
    db: result.ok ? "up" : "down",
    ...(result.ok ? {} : { error: result.error }),
  };
  return NextResponse.json(body, { status: result.ok ? 200 : 503 });
}
