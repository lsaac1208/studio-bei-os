import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  type LandingBlock,
  type LandingBlockKind,
  type LandingFitData,
  type LandingPricingData,
  type LandingProcessData,
  type LandingServiceData,
  landingBlocks,
} from "@/db/schema";
import {
  DEFAULT_FIT_GOOD,
  DEFAULT_FIT_NOT,
  DEFAULT_PRICING,
  DEFAULT_PROCESS,
  DEFAULT_SERVICES,
} from "@/lib/landing-defaults";

/**
 * 列出某 kind 的所有 blocks（按 order）。
 *
 * @param kind     LandingBlockKind
 * @param opts.includeUnpublished  默认 false：仅返回已发布的（首页用）
 *                                 true：返回全部（admin 用）
 */
export async function listLandingBlocks(
  kind: LandingBlockKind,
  opts: { includeUnpublished?: boolean } = {},
): Promise<LandingBlock[]> {
  const conds = opts.includeUnpublished
    ? [eq(landingBlocks.kind, kind)]
    : [eq(landingBlocks.kind, kind), eq(landingBlocks.published, true)];
  return db
    .select()
    .from(landingBlocks)
    .where(and(...conds))
    .orderBy(asc(landingBlocks.order), asc(landingBlocks.createdAt));
}

/**
 * 取某 kind 的内容并按形状返回。DB 为空 → fallback 到默认数据。
 *
 * 这些函数被 marketing 组件（Services / Pricing / Process / Fit）调用，
 * 在 build 时无 DB 或 DB 瞬时不可用时也能渲染（catch + fallback）。
 */
export async function getServicesContent(): Promise<LandingServiceData[]> {
  try {
    const rows = await listLandingBlocks("service");
    if (rows.length === 0) return DEFAULT_SERVICES;
    return rows.map((r) => r.data as LandingServiceData);
  } catch (err) {
    console.warn("[landing] getServicesContent failed, fallback to defaults", err);
    return DEFAULT_SERVICES;
  }
}

export async function getPricingContent(): Promise<LandingPricingData[]> {
  try {
    const rows = await listLandingBlocks("pricing");
    if (rows.length === 0) return DEFAULT_PRICING;
    return rows.map((r) => r.data as LandingPricingData);
  } catch (err) {
    console.warn("[landing] getPricingContent failed, fallback to defaults", err);
    return DEFAULT_PRICING;
  }
}

export async function getProcessContent(): Promise<LandingProcessData[]> {
  try {
    const rows = await listLandingBlocks("process");
    if (rows.length === 0) return DEFAULT_PROCESS;
    return rows.map((r) => r.data as LandingProcessData);
  } catch (err) {
    console.warn("[landing] getProcessContent failed, fallback to defaults", err);
    return DEFAULT_PROCESS;
  }
}

export async function getFitContent(): Promise<{
  good: LandingFitData[];
  not: LandingFitData[];
}> {
  try {
    const [goodRows, notRows] = await Promise.all([
      listLandingBlocks("fit_good"),
      listLandingBlocks("fit_not"),
    ]);
    return {
      good: goodRows.length > 0 ? goodRows.map((r) => r.data as LandingFitData) : DEFAULT_FIT_GOOD,
      not: notRows.length > 0 ? notRows.map((r) => r.data as LandingFitData) : DEFAULT_FIT_NOT,
    };
  } catch (err) {
    console.warn("[landing] getFitContent failed, fallback to defaults", err);
    return { good: DEFAULT_FIT_GOOD, not: DEFAULT_FIT_NOT };
  }
}
