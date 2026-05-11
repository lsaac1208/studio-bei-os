import "server-only";
import { and, asc, count, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { type LeadStatus, leadNotes, leads, type Priority } from "@/db/schema";

// ─────────────────────────────────────────────────────────────
// 待办（pending follow-ups）
// next_follow_up_at 不为空且未完成；默认隐藏 ARCHIVED 线索的备注
// ─────────────────────────────────────────────────────────────

export interface PendingTodo {
  noteId: string;
  noteContent: string;
  nextFollowUpAt: Date;
  noteCreatedAt: Date;
  leadId: string;
  leadCode: string;
  leadName: string;
  leadStatus: LeadStatus;
  leadPriority: Priority;
}

const TODOS_HARD_LIMIT = 500;

export async function listPendingTodos(): Promise<PendingTodo[]> {
  const rows = await db
    .select({
      noteId: leadNotes.id,
      noteContent: leadNotes.content,
      nextFollowUpAt: leadNotes.nextFollowUpAt,
      noteCreatedAt: leadNotes.createdAt,
      leadId: leads.id,
      leadCode: leads.code,
      leadName: leads.name,
      leadStatus: leads.status,
      leadPriority: leads.priority,
    })
    .from(leadNotes)
    .innerJoin(leads, eq(leads.id, leadNotes.leadId))
    .where(
      and(
        isNotNull(leadNotes.nextFollowUpAt),
        isNull(leadNotes.completedAt),
        sql`${leads.status} <> 'ARCHIVED'`,
      ),
    )
    .orderBy(asc(leadNotes.nextFollowUpAt))
    .limit(TODOS_HARD_LIMIT);

  // nextFollowUpAt 因 isNotNull 过滤，运行时不为 null；类型上仍是 Date | null，强转
  return rows.map((r) => ({
    ...r,
    nextFollowUpAt: r.nextFollowUpAt as Date,
  }));
}

/**
 * 待办计数（顶栏徽章用）。
 * 默认仅计逾期 + 今天内的，避免徽章数因远期任务太大失去提醒意义。
 * 传 includeFuture=true 取全部未完成。
 */
export async function countPendingTodos({
  includeFuture = false,
}: {
  includeFuture?: boolean;
} = {}): Promise<number> {
  const conds = [
    isNotNull(leadNotes.nextFollowUpAt),
    isNull(leadNotes.completedAt),
    sql`${leads.status} <> 'ARCHIVED'`,
  ];
  if (!includeFuture) {
    // 简化：next_follow_up_at <= now() + interval '1 day'，即 24h 内（够用）
    conds.push(sql`${leadNotes.nextFollowUpAt} <= now() + interval '1 day'`);
  }
  const [row] = await db
    .select({ n: count() })
    .from(leadNotes)
    .innerJoin(leads, eq(leads.id, leadNotes.leadId))
    .where(and(...conds));
  return Number(row?.n ?? 0);
}
