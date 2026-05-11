import "server-only";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { type Lead, type LeadStatus, leads } from "@/db/schema";

// ─────────────────────────────────────────────────────────────
// 看板查询（按状态分组）
// ─────────────────────────────────────────────────────────────

const KANBAN_STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFYING", "QUOTED", "WON", "LOST"];

export const KANBAN_VISIBLE_STATUSES = KANBAN_STATUSES;

export interface KanbanResult {
  groups: Record<LeadStatus, Lead[]>;
  total: number;
}

/**
 * 看板视图：按状态分组返回。
 *  - 默认隐藏 ARCHIVED
 *  - 排序：HIGH 优先级置顶 → 最新优先
 */
export async function kanbanLeads(): Promise<KanbanResult> {
  const rows = await db
    .select()
    .from(leads)
    .where(sql`${leads.status} <> 'ARCHIVED'`)
    .orderBy(
      sql`CASE ${leads.priority} WHEN 'HIGH' THEN 0 WHEN 'NORMAL' THEN 1 ELSE 2 END`,
      desc(leads.createdAt),
    );

  const groups: Record<LeadStatus, Lead[]> = {
    NEW: [],
    CONTACTED: [],
    QUALIFYING: [],
    QUOTED: [],
    WON: [],
    LOST: [],
    ARCHIVED: [],
  };

  for (const lead of rows) {
    groups[lead.status]?.push(lead);
  }

  return { groups, total: rows.length };
}
