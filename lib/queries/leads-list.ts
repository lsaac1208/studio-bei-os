import "server-only";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db/client";
import { type BusinessType, type Lead, type LeadStatus, leads } from "@/db/schema";

// ─────────────────────────────────────────────────────────────
// 列表查询 + 导出查询（共享 where 构造）
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

export const EXPORT_HARD_LIMIT = 5000;

/** 导出查询：复用过滤条件，硬上限 5000 行（避免内存爆掉） */
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
