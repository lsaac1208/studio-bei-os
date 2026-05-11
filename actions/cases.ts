"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import {
  createCaseInternal,
  deleteCaseInternal,
  moveCaseInternal,
  toggleFeaturedInternal,
  togglePublishedInternal,
  updateCaseInternal,
} from "@/lib/cases-mutations";
import { caseUpsertSchema } from "@/lib/validators";

/**
 * 创建案例
 */
export async function createCase(input: unknown) {
  const parsed = caseUpsertSchema.parse(input);
  await requireAdmin();
  const row = await createCaseInternal(parsed);
  return { ok: true as const, id: row.id, slug: row.slug };
}

/**
 * 全量更新案例（patch 模式：未传字段保持原值）
 */
const UpdateInput = z.object({
  id: z.string().min(1),
  patch: caseUpsertSchema.partial(),
});

export async function updateCase(input: { id: string; patch: Partial<unknown> }) {
  const parsed = UpdateInput.parse(input);
  await requireAdmin();
  const row = await updateCaseInternal(parsed.id, parsed.patch);
  return { ok: true as const, slug: row.slug };
}

const IdInput = z.object({ id: z.string().min(1) });

export async function deleteCase(input: { id: string }) {
  const parsed = IdInput.parse(input);
  await requireAdmin();
  await deleteCaseInternal(parsed.id);
  return { ok: true as const };
}

const PublishInput = z.object({
  id: z.string().min(1),
  published: z.boolean(),
});

export async function togglePublishedCase(input: { id: string; published: boolean }) {
  const parsed = PublishInput.parse(input);
  await requireAdmin();
  await togglePublishedInternal(parsed.id, parsed.published);
  return { ok: true as const };
}

const FeaturedInput = z.object({
  id: z.string().min(1),
  featured: z.boolean(),
});

export async function toggleFeaturedCase(input: { id: string; featured: boolean }) {
  const parsed = FeaturedInput.parse(input);
  await requireAdmin();
  await toggleFeaturedInternal(parsed.id, parsed.featured);
  return { ok: true as const };
}

const MoveInput = z.object({
  id: z.string().min(1),
  direction: z.enum(["up", "down"]),
});

export async function moveCase(input: { id: string; direction: "up" | "down" }) {
  const parsed = MoveInput.parse(input);
  await requireAdmin();
  await moveCaseInternal(parsed.id, parsed.direction);
  return { ok: true as const };
}
