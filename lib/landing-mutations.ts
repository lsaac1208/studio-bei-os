import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import {
  type LandingBlock,
  type LandingBlockData,
  type LandingBlockKind,
  landingBlocks,
} from "@/db/schema";

/**
 * 受信变更 helpers — 不走 session 验证。
 * 调用方（actions/landing.ts）必须自行保证是 requireAdmin 后的调用。
 */

function revalidateLandingPaths() {
  revalidatePath("/admin/landing");
  revalidatePath("/"); // 首页
}

export async function createLandingBlockInternal(input: {
  kind: LandingBlockKind;
  data: LandingBlockData;
  published?: boolean;
}): Promise<LandingBlock> {
  // 同 kind 内 max(order) + 1
  const [maxRow] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${landingBlocks.order}), -1)` })
    .from(landingBlocks)
    .where(eq(landingBlocks.kind, input.kind));
  const nextOrder = (maxRow?.maxOrder ?? -1) + 1;

  const [row] = await db
    .insert(landingBlocks)
    .values({
      kind: input.kind,
      data: input.data,
      published: input.published ?? true,
      order: nextOrder,
    })
    .returning();
  if (!row) throw new Error("Failed to insert landing block");
  revalidateLandingPaths();
  return row;
}

export async function updateLandingBlockInternal(
  id: string,
  patch: { data?: LandingBlockData; published?: boolean },
): Promise<LandingBlock> {
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.data !== undefined) update.data = patch.data;
  if (patch.published !== undefined) update.published = patch.published;

  const [row] = await db
    .update(landingBlocks)
    .set(update)
    .where(eq(landingBlocks.id, id))
    .returning();
  if (!row) throw new Error("Landing block not found");
  revalidateLandingPaths();
  return row;
}

export async function deleteLandingBlockInternal(id: string): Promise<void> {
  await db.delete(landingBlocks).where(eq(landingBlocks.id, id));
  revalidateLandingPaths();
}

/**
 * 上下移动同 kind 内单个 block 的顺序，与相邻块交换 order。
 */
export async function moveLandingBlockInternal(
  id: string,
  direction: "up" | "down",
): Promise<void> {
  const [target] = await db.select().from(landingBlocks).where(eq(landingBlocks.id, id)).limit(1);
  if (!target) throw new Error("Landing block not found");

  const siblings = await db
    .select({ id: landingBlocks.id, order: landingBlocks.order })
    .from(landingBlocks)
    .where(eq(landingBlocks.kind, target.kind))
    .orderBy(asc(landingBlocks.order), asc(landingBlocks.createdAt));

  const idx = siblings.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error("Landing block not found in siblings");

  const neighborIdx = direction === "up" ? idx - 1 : idx + 1;
  if (neighborIdx < 0 || neighborIdx >= siblings.length) return; // 已在边界

  const self = siblings[idx];
  const neighbor = siblings[neighborIdx];

  await db.transaction(async (tx) => {
    await tx
      .update(landingBlocks)
      .set({ order: neighbor.order, updatedAt: new Date() })
      .where(eq(landingBlocks.id, self.id));
    await tx
      .update(landingBlocks)
      .set({ order: self.order, updatedAt: new Date() })
      .where(eq(landingBlocks.id, neighbor.id));
  });

  revalidateLandingPaths();
}
