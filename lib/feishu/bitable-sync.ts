import "server-only";

import { and, eq, isNull, lte, or } from "drizzle-orm";
import { db } from "@/db/client";
import { type Lead, leadActivities, leads } from "@/db/schema";
import { scopedLogger } from "@/lib/logger";
import { getSetting, setSetting } from "@/lib/settings";
import {
  type BitableLeadUpdate,
  isBitableEnabled,
  pullBitableUpdates,
  pushLeadToBitable,
} from "./bitable";

const log = scopedLogger("bitable-sync");

/**
 * Bitable 增量同步任务（cron 调用）。
 *
 * 流程：
 *  1. PUSH 自愈：把还没推过 / 同步时间老于阈值的 lead 推到 bitable
 *  2. PULL：拉 bitable 上 last_modified > since 的记录，回写 status / priority
 *  3. 写一条 BITABLE_SYNC activity（仅 PULL 命中变化时；PUSH 自愈不写 activity 避免噪声）
 *  4. 把 settings.bitable.lastPullAt 推进
 *
 * 错误策略：
 *  - 单条失败不打断整体；最后汇总返回
 *  - 整体失败 → throw（让 cron route 返回 500，systemd 会记录）
 */

const SYNC_THROTTLE_MS = 60 * 60 * 1000; // 1h：超过这个间隔的 lead 在自愈循环中重推
const PUSH_BATCH_LIMIT = 50; // 每轮最多自愈推送 50 条，避免飞书 API rate-limit
const DEFAULT_PULL_LOOKBACK_MS = 30 * 60 * 1000; // 首次同步：仅看过去 30min（避免拉全量）

export interface BitableSyncResult {
  ok: true;
  enabled: boolean;
  pushed: number;
  pushFailed: number;
  pulledChecked: number;
  pulledApplied: number;
  pullFailed: number;
  sinceISO: string;
}

export async function runBitableSync(): Promise<BitableSyncResult> {
  if (!(await isBitableEnabled())) {
    return {
      ok: true,
      enabled: false,
      pushed: 0,
      pushFailed: 0,
      pulledChecked: 0,
      pulledApplied: 0,
      pullFailed: 0,
      sinceISO: new Date(0).toISOString(),
    };
  }

  // ── 1) PUSH 自愈 ──────────────────────────────────────────
  // 找出：record_id 为 null（从未推过） OR synced_at 早于 1h（防止 update 漏推）
  // 排除已归档（不希望持续刷新）
  const threshold = new Date(Date.now() - SYNC_THROTTLE_MS);
  const candidates = await db
    .select()
    .from(leads)
    .where(
      and(
        // status != ARCHIVED
        // drizzle 的 ne / not 写起来比较啰嗦，这里用 or 排除归档
        or(
          eq(leads.status, "NEW"),
          eq(leads.status, "CONTACTED"),
          eq(leads.status, "QUALIFYING"),
          eq(leads.status, "QUOTED"),
          eq(leads.status, "WON"),
          eq(leads.status, "LOST"),
        ),
        or(isNull(leads.bitableRecordId), lte(leads.bitableSyncedAt, threshold)),
      ),
    )
    .limit(PUSH_BATCH_LIMIT);

  let pushed = 0;
  let pushFailed = 0;
  for (const lead of candidates) {
    try {
      const { recordId } = await pushLeadToBitable(lead);
      await db
        .update(leads)
        .set({ bitableRecordId: recordId, bitableSyncedAt: new Date() })
        .where(eq(leads.id, lead.id));
      pushed += 1;
    } catch (err) {
      log.warn({ err, leadId: lead.id }, "push lead failed");
      pushFailed += 1;
    }
  }

  // ── 2) PULL 增量 ───────────────────────────────────────────
  const lastPullStr = await getSetting("bitable.lastPullAt");
  const lastPull = lastPullStr
    ? new Date(lastPullStr)
    : new Date(Date.now() - DEFAULT_PULL_LOOKBACK_MS);

  let updates: BitableLeadUpdate[] = [];
  let pullFailed = 0;
  try {
    updates = await pullBitableUpdates(lastPull);
  } catch (err) {
    log.error({ err }, "pull failed");
    pullFailed = 1;
  }

  let pulledApplied = 0;
  for (const u of updates) {
    try {
      const applied = await applyBitableUpdate(u);
      if (applied) pulledApplied += 1;
    } catch (err) {
      log.warn({ err, recordId: u.recordId }, "apply update failed");
      pullFailed += 1;
    }
  }

  // 推进 lastPullAt 到本轮开始时间（保守：用最旧 update 的 lastModifiedAt 之前的时间也行，
  // 这里用 now() 简单；若 pull 阶段失败则不推进，下次重试）
  if (pullFailed === 0) {
    await setSetting("bitable.lastPullAt", new Date().toISOString());
  }

  return {
    ok: true,
    enabled: true,
    pushed,
    pushFailed,
    pulledChecked: updates.length,
    pulledApplied,
    pullFailed,
    sinceISO: lastPull.toISOString(),
  };
}

/**
 * 把单条 bitable update 应用到本地 lead。
 * 返回：是否真的产生了变化（status / priority 至少一项被改）。
 */
async function applyBitableUpdate(u: BitableLeadUpdate): Promise<boolean> {
  const [lead] = await db
    .select()
    .from(leads)
    .where(eq(leads.bitableRecordId, u.recordId))
    .limit(1);
  if (!lead) return false; // bitable 上的 record 在本地找不到（手工新增的）— 跳过

  const patch: Partial<Pick<Lead, "status" | "priority" | "bitableSyncedAt">> = {
    bitableSyncedAt: new Date(),
  };
  const changes: string[] = [];

  if (u.status && u.status !== lead.status && isValidStatus(u.status)) {
    patch.status = u.status as Lead["status"];
    changes.push(`状态：${lead.status} → ${u.status}`);
  }
  if (u.priority && u.priority !== lead.priority && isValidPriority(u.priority)) {
    patch.priority = u.priority as Lead["priority"];
    changes.push(`优先级：${lead.priority} → ${u.priority}`);
  }
  if (changes.length === 0) {
    // 仅更新 syncedAt，不写 activity
    await db.update(leads).set(patch).where(eq(leads.id, lead.id));
    return false;
  }

  await db.transaction(async (tx) => {
    await tx
      .update(leads)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(leads.id, lead.id));
    await tx.insert(leadActivities).values({
      leadId: lead.id,
      type: "BITABLE_SYNC",
      content: `飞书表格回流：${changes.join(" · ")}`,
      actor: "bitable",
    });
  });
  return true;
}

const VALID_STATUS = new Set([
  "NEW",
  "CONTACTED",
  "QUALIFYING",
  "QUOTED",
  "WON",
  "LOST",
  "ARCHIVED",
]);
const VALID_PRIORITY = new Set(["LOW", "NORMAL", "HIGH"]);
const isValidStatus = (s: string) => VALID_STATUS.has(s);
const isValidPriority = (p: string) => VALID_PRIORITY.has(p);
