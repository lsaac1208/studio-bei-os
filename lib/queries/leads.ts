import "server-only";
import { and, asc, count, desc, eq, ilike, isNotNull, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  type BusinessType,
  type Lead,
  type LeadStatus,
  leadActivities,
  leadNotes,
  leads,
  type Priority,
} from "@/db/schema";

// ─────────────────────────────────────────────────────────────
// 列表查询
// ─────────────────────────────────────────────────────────────

export interface ListLeadsFilters {
  status?: LeadStatus;
  businessType?: BusinessType;
  q?: string; // 关键词：匹配 code / name / wechat / phone / email / message
  page?: number; // 1-based
  pageSize?: number;
}

export interface ListLeadsResult {
  rows: Lead[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

/** 共享 where 构造：listLeads 与 listLeadsForExport 公用 */
function buildLeadsWhere(filters: Pick<ListLeadsFilters, "status" | "businessType" | "q">) {
  const conditions = [];
  if (filters.status) conditions.push(eq(leads.status, filters.status));
  if (filters.businessType) conditions.push(eq(leads.businessType, filters.businessType));

  const trimmedQ = filters.q?.trim();
  if (trimmedQ) {
    const pattern = `%${trimmedQ}%`;
    const orExpr = or(
      ilike(leads.code, pattern),
      ilike(leads.name, pattern),
      ilike(leads.wechat, pattern),
      ilike(leads.phone, pattern),
      ilike(leads.email, pattern),
      ilike(leads.message, pattern),
    );
    if (orExpr) conditions.push(orExpr);
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function listLeads(filters: ListLeadsFilters = {}): Promise<ListLeadsResult> {
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const pageSize = Math.max(1, Math.min(100, Math.floor(filters.pageSize ?? 20)));
  const offset = (page - 1) * pageSize;

  const where = buildLeadsWhere(filters);

  const [rows, totalResult] = await Promise.all([
    db
      .select()
      .from(leads)
      .where(where)
      .orderBy(desc(leads.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ total: count() }).from(leads).where(where),
  ]);

  const total = Number(totalResult[0]?.total ?? 0);

  return {
    rows,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

// ─────────────────────────────────────────────────────────────
// 导出查询：复用过滤条件，硬上限 5000 行（避免内存爆掉）
// ─────────────────────────────────────────────────────────────

export const EXPORT_HARD_LIMIT = 5000;

export async function listLeadsForExport(
  filters: Pick<ListLeadsFilters, "status" | "businessType" | "q"> = {},
): Promise<{ rows: Lead[]; truncated: boolean }> {
  const where = buildLeadsWhere(filters);
  const rows = await db
    .select()
    .from(leads)
    .where(where)
    .orderBy(desc(leads.createdAt))
    .limit(EXPORT_HARD_LIMIT + 1);

  const truncated = rows.length > EXPORT_HARD_LIMIT;
  return { rows: truncated ? rows.slice(0, EXPORT_HARD_LIMIT) : rows, truncated };
}

// ─────────────────────────────────────────────────────────────
// 看板查询（按状态分组）
// ─────────────────────────────────────────────────────────────

const KANBAN_STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFYING", "QUOTED", "WON", "LOST"];

export interface KanbanResult {
  groups: Record<LeadStatus, Lead[]>;
  total: number;
}

/**
 * 看板视图：按状态分组返回。
 * - 默认隐藏 ARCHIVED
 * - 排序：HIGH 优先级置顶 → 最新优先
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

export const KANBAN_VISIBLE_STATUSES = KANBAN_STATUSES;

// ─────────────────────────────────────────────────────────────
// 单条线索（M7 详情页用）
// ─────────────────────────────────────────────────────────────

export async function getLeadById(id: string): Promise<Lead | null> {
  const [row] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return row ?? null;
}

// ─────────────────────────────────────────────────────────────
// 时间线：activities + notes 合并按时间倒序
// ─────────────────────────────────────────────────────────────

export type TimelineItem =
  | {
      kind: "activity";
      id: string;
      type: string; // CREATE | STATUS_CHANGE | PRIORITY_CHANGE | NOTE_ADDED | FEISHU_CARD_ACTION ...
      content: string;
      actor: string | null;
      createdAt: Date;
    }
  | {
      kind: "note";
      id: string;
      content: string;
      nextFollowUpAt: Date | null;
      completedAt: Date | null;
      createdAt: Date;
    };

export async function getLeadTimeline(leadId: string): Promise<TimelineItem[]> {
  const [activities, notes] = await Promise.all([
    db
      .select()
      .from(leadActivities)
      .where(eq(leadActivities.leadId, leadId))
      .orderBy(desc(leadActivities.createdAt)),
    db
      .select()
      .from(leadNotes)
      .where(eq(leadNotes.leadId, leadId))
      .orderBy(desc(leadNotes.createdAt)),
  ]);

  const items: TimelineItem[] = [
    ...activities.map(
      (a): TimelineItem => ({
        kind: "activity",
        id: a.id,
        type: a.type,
        content: a.content,
        actor: a.actor,
        createdAt: a.createdAt,
      }),
    ),
    ...notes.map(
      (n): TimelineItem => ({
        kind: "note",
        id: n.id,
        content: n.content,
        nextFollowUpAt: n.nextFollowUpAt,
        completedAt: n.completedAt,
        createdAt: n.createdAt,
      }),
    ),
  ];

  // 合并后按 createdAt 倒序
  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return items;
}

// ─────────────────────────────────────────────────────────────
// 待办（pending follow-ups）：next_follow_up_at 不为空且未完成
// 关联 lead 基础字段，且默认隐藏 ARCHIVED
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
    // 今天结束（北京时间）= now 取的当地日期 23:59:59.999；
    // postgres 用 (now() at time zone 'Asia/Shanghai')::date + 1 - epsilon 计算更准；
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
