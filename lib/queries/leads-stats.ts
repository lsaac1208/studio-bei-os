import "server-only";
import { count, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { type BusinessType, type LeadStatus, leads } from "@/db/schema";

// ─────────────────────────────────────────────────────────────
// 周报统计：上周（北京时间，周一 ~ 周日）的新增 / 转化 / 各状态分布
// ─────────────────────────────────────────────────────────────

export interface WeeklyLeadStats {
  /** 区间起始 UTC 毫秒（北京时间上周一 00:00） */
  startMs: number;
  /** 区间结束 UTC 毫秒（exclusive；北京时间本周一 00:00） */
  endMs: number;
  /** 上周新增的线索总数 */
  newLeads: number;
  /** 上周新增、且当前已进入 QUOTED/SIGNED/CLOSED_WON 的数量 */
  converted: number;
  /** 各业务方向的新增分布 */
  byBusiness: Array<{ businessType: BusinessType; n: number }>;
  /** 各状态的当前分布（全量，不分时间） */
  byStatus: Array<{ status: LeadStatus; n: number }>;
}

export async function getWeeklyLeadStats(now: Date = new Date()): Promise<WeeklyLeadStats> {
  const { startMs, endMs } = lastWeekRangeBeijing(now);
  const startIso = new Date(startMs).toISOString();
  const endIso = new Date(endMs).toISOString();

  // 上周新增
  const [{ n: newCount }] = await db
    .select({ n: count() })
    .from(leads)
    .where(sql`${leads.createdAt} >= ${startIso} AND ${leads.createdAt} < ${endIso}`);

  // 上周新增 → 当前已转化（QUOTED / SIGNED / CLOSED_WON 视为已转化）
  const [{ n: convertedCount }] = await db
    .select({ n: count() })
    .from(leads)
    .where(
      sql`${leads.createdAt} >= ${startIso} AND ${leads.createdAt} < ${endIso}
        AND ${leads.status} IN ('QUOTED','SIGNED','CLOSED_WON')`,
    );

  // 上周新增的业务方向分布
  const byBusiness = await db
    .select({ businessType: leads.businessType, n: count() })
    .from(leads)
    .where(sql`${leads.createdAt} >= ${startIso} AND ${leads.createdAt} < ${endIso}`)
    .groupBy(leads.businessType);

  // 当前线索的状态分布（全量）
  const byStatus = await db
    .select({ status: leads.status, n: count() })
    .from(leads)
    .groupBy(leads.status);

  return {
    startMs,
    endMs,
    newLeads: Number(newCount),
    converted: Number(convertedCount),
    byBusiness: byBusiness.map((r) => ({ businessType: r.businessType, n: Number(r.n) })),
    byStatus: byStatus.map((r) => ({ status: r.status, n: Number(r.n) })),
  };
}

/**
 * 给定 now，返回北京时间"上周一 00:00"到"本周一 00:00"对应的 UTC 毫秒。
 * 若 now 本身就是周一凌晨执行（推荐的周报时机），即 [本周一-7d, 本周一)。
 */
function lastWeekRangeBeijing(now: Date): { startMs: number; endMs: number } {
  const beijingOffsetMs = 8 * 3600 * 1000;
  const local = new Date(now.getTime() + beijingOffsetMs);
  // getUTCDay: 0=Sunday, 1=Monday, ..., 6=Saturday
  const day = local.getUTCDay();
  // 距离本周一往前的天数（周一 → 0；周日 → 6）
  const sinceMonday = (day + 6) % 7;
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate() - sinceMonday;
  const thisMondayBeijingMidnightUtc = Date.UTC(y, m, d, 0, 0, 0, 0) - beijingOffsetMs;
  const lastMondayBeijingMidnightUtc = thisMondayBeijingMidnightUtc - 7 * 24 * 3600 * 1000;
  return { startMs: lastMondayBeijingMidnightUtc, endMs: thisMondayBeijingMidnightUtc };
}
