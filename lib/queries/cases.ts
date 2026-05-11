import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { type Case, cases } from "@/db/schema";

/**
 * 列出案例。
 * - 默认仅 published=true，按 order 升序，同 order 按 createdAt 升序
 * - includeUnpublished：后台列表用，全量
 */
export async function listCases(opts: { includeUnpublished?: boolean } = {}): Promise<Case[]> {
  if (opts.includeUnpublished) {
    return db.select().from(cases).orderBy(asc(cases.order), asc(cases.createdAt));
  }
  return db
    .select()
    .from(cases)
    .where(eq(cases.published, true))
    .orderBy(asc(cases.order), asc(cases.createdAt));
}

/**
 * 仅取 featured + published 的案例（首页推荐位）。
 */
export async function listFeaturedCases(): Promise<Case[]> {
  return db
    .select()
    .from(cases)
    .where(and(eq(cases.published, true), eq(cases.featured, true)))
    .orderBy(asc(cases.order), asc(cases.createdAt));
}

export async function getCaseBySlug(slug: string): Promise<Case | null> {
  const [row] = await db.select().from(cases).where(eq(cases.slug, slug)).limit(1);
  return row ?? null;
}

export async function getCaseById(id: string): Promise<Case | null> {
  const [row] = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
  return row ?? null;
}

export async function getPublishedCaseBySlug(slug: string): Promise<Case | null> {
  const [row] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.slug, slug), eq(cases.published, true)))
    .limit(1);
  return row ?? null;
}
