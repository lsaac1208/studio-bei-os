import "server-only";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { type Faq, faqs } from "@/db/schema";

/**
 * 受信变更 helpers — 不走 session 验证。
 * 调用方（actions/faq.ts）必须自行保证是 requireAdmin 后的调用。
 */

function revalidateFaqPaths() {
  revalidatePath("/admin/faqs");
  revalidatePath("/");
  revalidatePath("/contact");
  // 公开 API 走 route handler，靠 TanStack Query 或浏览器刷新拉新，这里不强求
}

export async function createFaqInternal(data: {
  question: string;
  answer: string;
  published?: boolean;
}): Promise<Faq> {
  // 新条目追到末尾：取当前 max(order) + 1
  const [maxRow] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${faqs.order}), -1)` })
    .from(faqs);
  const nextOrder = (maxRow?.maxOrder ?? -1) + 1;

  const [row] = await db
    .insert(faqs)
    .values({
      question: data.question,
      answer: data.answer,
      published: data.published ?? true,
      order: nextOrder,
    })
    .returning();
  if (!row) throw new Error("Failed to insert FAQ");
  revalidateFaqPaths();
  return row;
}

export async function updateFaqInternal(
  id: string,
  patch: {
    question?: string;
    answer?: string;
    published?: boolean;
  },
): Promise<Faq> {
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.question !== undefined) update.question = patch.question;
  if (patch.answer !== undefined) update.answer = patch.answer;
  if (patch.published !== undefined) update.published = patch.published;

  const [row] = await db.update(faqs).set(update).where(eq(faqs.id, id)).returning();
  if (!row) throw new Error("FAQ not found");
  revalidateFaqPaths();
  return row;
}

export async function deleteFaqInternal(id: string): Promise<void> {
  await db.delete(faqs).where(eq(faqs.id, id));
  revalidateFaqPaths();
}

/**
 * 上下调整单条 FAQ 的顺序。方向："up" | "down"。
 * 方法：和相邻同方向的 FAQ 交换 order 值（全量 select + 2 次 update）。
 */
export async function moveFaqInternal(id: string, direction: "up" | "down"): Promise<void> {
  const all = await db
    .select({ id: faqs.id, order: faqs.order })
    .from(faqs)
    .orderBy(asc(faqs.order), asc(faqs.createdAt));

  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error("FAQ not found");

  const neighborIdx = direction === "up" ? idx - 1 : idx + 1;
  if (neighborIdx < 0 || neighborIdx >= all.length) return; // 已经在边界

  const self = all[idx];
  const neighbor = all[neighborIdx];

  await db.transaction(async (tx) => {
    await tx
      .update(faqs)
      .set({ order: neighbor.order, updatedAt: new Date() })
      .where(eq(faqs.id, self.id));
    await tx
      .update(faqs)
      .set({ order: self.order, updatedAt: new Date() })
      .where(eq(faqs.id, neighbor.id));
  });

  revalidateFaqPaths();
}

/**
 * 批量 reorder（前端传完整顺序列表，一次性 upsert）。
 * 目前后台 UI 只用 moveFaqInternal 的上下移；这个函数留给未来拖拽排序。
 */
export async function reorderFaqsInternal(
  items: Array<{ id: string; order: number }>,
): Promise<void> {
  if (items.length === 0) return;
  const ids = items.map((i) => i.id);

  await db.transaction(async (tx) => {
    for (const it of items) {
      await tx
        .update(faqs)
        .set({ order: it.order, updatedAt: new Date() })
        .where(eq(faqs.id, it.id));
    }
  });

  // 仅确认 ids 合法（没有意外新增），这里 inArray 只做简单防御
  await db.select({ id: faqs.id }).from(faqs).where(inArray(faqs.id, ids));

  revalidateFaqPaths();
}
