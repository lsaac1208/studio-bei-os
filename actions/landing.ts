"use server";

import { z } from "zod";
import type { LandingBlockData, LandingBlockKind } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-server";
import {
  createLandingBlockInternal,
  deleteLandingBlockInternal,
  moveLandingBlockInternal,
  updateLandingBlockInternal,
} from "@/lib/landing-mutations";

// ─────────────────────────────────────────────────────────────
// 不同 kind 的 data 形状校验
// ─────────────────────────────────────────────────────────────

const ServiceData = z.object({
  num: z.string().trim().min(1).max(8),
  title: z.string().trim().min(2).max(80),
  desc: z.string().trim().min(2).max(400),
  bullets: z.array(z.string().trim().min(2).max(120)).min(1).max(8),
  tagline: z.string().trim().min(2).max(80),
});

const PricingData = z.object({
  label: z.string().trim().min(2).max(40),
  price: z.string().trim().min(1).max(60),
  desc: z.string().trim().min(2).max(400),
  bullets: z.array(z.string().trim().min(2).max(120)).min(1).max(8),
  featured: z.boolean(),
});

const ProcessData = z.object({
  num: z.string().trim().min(1).max(8),
  title: z.string().trim().min(2).max(80),
  desc: z.string().trim().min(2).max(400),
});

const FitData = z.object({
  text: z.string().trim().min(2).max(120),
});

const KindEnum = z.enum(["service", "pricing", "process", "fit_good", "fit_not"]);

/**
 * 按 kind 解析 data。各 kind 的形状校验在这里集中。
 * 返回 typed data，供 mutation 使用。
 */
function parseDataByKind(kind: LandingBlockKind, data: unknown): LandingBlockData {
  switch (kind) {
    case "service":
      return ServiceData.parse(data);
    case "pricing":
      return PricingData.parse(data);
    case "process":
      return ProcessData.parse(data);
    case "fit_good":
    case "fit_not":
      return FitData.parse(data);
    default: {
      // 编译期穷尽性
      const _exhaustive: never = kind;
      throw new Error(`Unknown landing block kind: ${_exhaustive as string}`);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Server Actions
// ─────────────────────────────────────────────────────────────

const CreateInput = z.object({
  kind: KindEnum,
  data: z.unknown(),
  published: z.boolean().optional(),
});

export async function createLandingBlock(input: {
  kind: LandingBlockKind;
  data: unknown;
  published?: boolean;
}) {
  const parsed = CreateInput.parse(input);
  await requireAdmin();
  const data = parseDataByKind(parsed.kind, parsed.data);
  const row = await createLandingBlockInternal({
    kind: parsed.kind,
    data,
    published: parsed.published,
  });
  return { ok: true as const, id: row.id };
}

const UpdateInput = z.object({
  id: z.string().min(1),
  kind: KindEnum,
  data: z.unknown().optional(),
  published: z.boolean().optional(),
});

export async function updateLandingBlock(input: {
  id: string;
  kind: LandingBlockKind;
  data?: unknown;
  published?: boolean;
}) {
  const parsed = UpdateInput.parse(input);
  await requireAdmin();
  const patch: { data?: LandingBlockData; published?: boolean } = {};
  if (parsed.data !== undefined) {
    patch.data = parseDataByKind(parsed.kind, parsed.data);
  }
  if (parsed.published !== undefined) {
    patch.published = parsed.published;
  }
  await updateLandingBlockInternal(parsed.id, patch);
  return { ok: true as const };
}

const DeleteInput = z.object({ id: z.string().min(1) });

export async function deleteLandingBlock(input: { id: string }) {
  const parsed = DeleteInput.parse(input);
  await requireAdmin();
  await deleteLandingBlockInternal(parsed.id);
  return { ok: true as const };
}

const MoveInput = z.object({
  id: z.string().min(1),
  direction: z.enum(["up", "down"]),
});

export async function moveLandingBlock(input: { id: string; direction: "up" | "down" }) {
  const parsed = MoveInput.parse(input);
  await requireAdmin();
  await moveLandingBlockInternal(parsed.id, parsed.direction);
  return { ok: true as const };
}
