import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { type Case, cases } from "@/db/schema";
import type { CaseUpsertInput } from "@/lib/validators";

/**
 * 受信变更 helpers — 不走 session 验证。
 * 调用方（actions/cases.ts）必须自行保证是 requireAdmin 后的调用。
 */

function revalidateCasePaths(slug?: string) {
  revalidatePath("/admin/cases");
  revalidatePath("/cases");
  revalidatePath("/"); // 首页 inline 案例区可能也变（featured / order 改了）
  if (slug) revalidatePath(`/cases/${slug}`);
}

/**
 * 把可选字符串字段：空串视为 null（DB 存 null 比 '' 更干净）
 */
function emptyToNull(v: string | undefined | null): string | null {
  if (v === undefined || v === null) return null;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * 把 ClientQuote / Body 里的空 caption 等字段做规整。
 */
function sanitizeQuote(q: CaseUpsertInput["clientQuote"]): Case["clientQuote"] {
  if (!q) return null;
  return {
    text: q.text,
    authorName: q.authorName,
    authorTitle: emptyToNull(q.authorTitle) ?? undefined,
  };
}

function sanitizeMetrics(m: CaseUpsertInput["metrics"]): Case["metrics"] {
  return m.map((it) => ({
    label: it.label,
    value: it.value,
    note: emptyToNull(it.note) ?? undefined,
  }));
}

function sanitizeGallery(g: CaseUpsertInput["gallery"]): Case["gallery"] {
  return g.map((it) => ({
    url: it.url,
    alt: it.alt,
    caption: emptyToNull(it.caption) ?? undefined,
  }));
}

export async function createCaseInternal(input: CaseUpsertInput): Promise<Case> {
  // 新条目追到末尾：取 max(order) + 1
  const [maxRow] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${cases.order}), -1)` })
    .from(cases);
  const nextOrder = (maxRow?.maxOrder ?? -1) + 1;

  const [row] = await db
    .insert(cases)
    .values({
      slug: input.slug,
      title: input.title,
      subtitle: emptyToNull(input.subtitle),
      summary: input.summary,
      outcomeSummary: emptyToNull(input.outcomeSummary),
      clientName: emptyToNull(input.clientName),
      industry: emptyToNull(input.industry),
      year: input.year ?? null,
      duration: emptyToNull(input.duration),
      coverImage: emptyToNull(input.coverImage),
      body: input.body ?? null,
      clientQuote: sanitizeQuote(input.clientQuote),
      demoComponent: input.demoComponent ?? null,
      tags: input.tags,
      techStack: input.techStack,
      metrics: sanitizeMetrics(input.metrics),
      gallery: sanitizeGallery(input.gallery),
      published: input.published,
      featured: input.featured,
      order: nextOrder,
    })
    .returning();
  if (!row) throw new Error("Failed to insert case");
  revalidateCasePaths(row.slug);
  return row;
}

export async function updateCaseInternal(
  id: string,
  patch: Partial<CaseUpsertInput>,
): Promise<Case> {
  const update: Record<string, unknown> = { updatedAt: new Date() };

  if (patch.slug !== undefined) update.slug = patch.slug;
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.subtitle !== undefined) update.subtitle = emptyToNull(patch.subtitle);
  if (patch.summary !== undefined) update.summary = patch.summary;
  if (patch.outcomeSummary !== undefined) update.outcomeSummary = emptyToNull(patch.outcomeSummary);
  if (patch.clientName !== undefined) update.clientName = emptyToNull(patch.clientName);
  if (patch.industry !== undefined) update.industry = emptyToNull(patch.industry);
  if (patch.year !== undefined) update.year = patch.year ?? null;
  if (patch.duration !== undefined) update.duration = emptyToNull(patch.duration);
  if (patch.coverImage !== undefined) update.coverImage = emptyToNull(patch.coverImage);
  if (patch.body !== undefined) update.body = patch.body ?? null;
  if (patch.clientQuote !== undefined) update.clientQuote = sanitizeQuote(patch.clientQuote);
  if (patch.demoComponent !== undefined) update.demoComponent = patch.demoComponent ?? null;
  if (patch.tags !== undefined) update.tags = patch.tags;
  if (patch.techStack !== undefined) update.techStack = patch.techStack;
  if (patch.metrics !== undefined) update.metrics = sanitizeMetrics(patch.metrics);
  if (patch.gallery !== undefined) update.gallery = sanitizeGallery(patch.gallery);
  if (patch.published !== undefined) update.published = patch.published;
  if (patch.featured !== undefined) update.featured = patch.featured;

  const [row] = await db.update(cases).set(update).where(eq(cases.id, id)).returning();
  if (!row) throw new Error("Case not found");
  revalidateCasePaths(row.slug);
  return row;
}

export async function deleteCaseInternal(id: string): Promise<void> {
  // 拿 slug 做 revalidate
  const [row] = await db.select({ slug: cases.slug }).from(cases).where(eq(cases.id, id)).limit(1);
  await db.delete(cases).where(eq(cases.id, id));
  revalidateCasePaths(row?.slug);
}

export async function togglePublishedInternal(id: string, published: boolean): Promise<Case> {
  const [row] = await db
    .update(cases)
    .set({ published, updatedAt: new Date() })
    .where(eq(cases.id, id))
    .returning();
  if (!row) throw new Error("Case not found");
  revalidateCasePaths(row.slug);
  return row;
}

export async function toggleFeaturedInternal(id: string, featured: boolean): Promise<Case> {
  const [row] = await db
    .update(cases)
    .set({ featured, updatedAt: new Date() })
    .where(eq(cases.id, id))
    .returning();
  if (!row) throw new Error("Case not found");
  revalidateCasePaths(row.slug);
  return row;
}

/**
 * 上下调整顺序：和相邻同方向案例交换 order。
 */
export async function moveCaseInternal(id: string, direction: "up" | "down"): Promise<void> {
  const all = await db
    .select({ id: cases.id, order: cases.order })
    .from(cases)
    .orderBy(asc(cases.order), asc(cases.createdAt));

  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error("Case not found");

  const neighborIdx = direction === "up" ? idx - 1 : idx + 1;
  if (neighborIdx < 0 || neighborIdx >= all.length) return; // 已在边界

  const self = all[idx];
  const neighbor = all[neighborIdx];

  await db.transaction(async (tx) => {
    await tx
      .update(cases)
      .set({ order: neighbor.order, updatedAt: new Date() })
      .where(eq(cases.id, self.id));
    await tx
      .update(cases)
      .set({ order: self.order, updatedAt: new Date() })
      .where(eq(cases.id, neighbor.id));
  });

  revalidateCasePaths();
}
