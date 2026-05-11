"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import {
  createFaqInternal,
  deleteFaqInternal,
  moveFaqInternal,
  reorderFaqsInternal,
  updateFaqInternal,
} from "@/lib/faq-mutations";

const CreateInput = z.object({
  question: z.string().trim().min(2, "问题至少 2 字").max(200, "问题最多 200 字"),
  answer: z.string().trim().min(2, "回答至少 2 字").max(4000, "回答最多 4000 字"),
  published: z.boolean().optional(),
});

export async function createFaq(input: { question: string; answer: string; published?: boolean }) {
  const parsed = CreateInput.parse(input);
  await requireAdmin();
  const row = await createFaqInternal(parsed);
  return { ok: true as const, id: row.id };
}

const UpdateInput = z.object({
  id: z.string().min(1),
  question: z.string().trim().min(2).max(200).optional(),
  answer: z.string().trim().min(2).max(4000).optional(),
  published: z.boolean().optional(),
});

export async function updateFaq(input: {
  id: string;
  question?: string;
  answer?: string;
  published?: boolean;
}) {
  const parsed = UpdateInput.parse(input);
  await requireAdmin();
  const { id, ...patch } = parsed;
  await updateFaqInternal(id, patch);
  return { ok: true as const };
}

const DeleteInput = z.object({ id: z.string().min(1) });

export async function deleteFaq(input: { id: string }) {
  const parsed = DeleteInput.parse(input);
  await requireAdmin();
  await deleteFaqInternal(parsed.id);
  return { ok: true as const };
}

const MoveInput = z.object({
  id: z.string().min(1),
  direction: z.enum(["up", "down"]),
});

export async function moveFaq(input: { id: string; direction: "up" | "down" }) {
  const parsed = MoveInput.parse(input);
  await requireAdmin();
  await moveFaqInternal(parsed.id, parsed.direction);
  return { ok: true as const };
}

const ReorderInput = z.object({
  items: z.array(z.object({ id: z.string().min(1), order: z.number().int().nonnegative() })).min(1),
});

export async function reorderFaqs(input: { items: Array<{ id: string; order: number }> }) {
  const parsed = ReorderInput.parse(input);
  await requireAdmin();
  await reorderFaqsInternal(parsed.items);
  return { ok: true as const };
}
