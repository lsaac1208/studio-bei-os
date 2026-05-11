import "server-only";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { type LeadStatus, leadActivities, leadNotes, leads, type Priority } from "@/db/schema";
import { isBitableEnabled, pushLeadToBitable } from "@/lib/feishu/bitable";
import { LEAD_STATUS_OPTIONS, PRIORITY_OPTIONS } from "@/lib/lead-options";

/**
 * Best-effort 把 lead 同步推到 bitable。
 * 失败仅 console.warn，不抛错（cron 会兜底重试）。
 * 调用方建议 fire-and-forget（void pushBitableSilent(...)）以免拖慢用户操作。
 */
async function pushBitableSilent(leadId: string): Promise<void> {
  try {
    if (!(await isBitableEnabled())) return;
    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (!lead) return;
    const { recordId } = await pushLeadToBitable(lead);
    await db
      .update(leads)
      .set({ bitableRecordId: recordId, bitableSyncedAt: new Date() })
      .where(eq(leads.id, leadId));
  } catch (err) {
    console.warn(`[bitable] push lead ${leadId} failed:`, err);
  }
}

// ─────────────────────────────────────────────────────────────
// 受信变更 helpers（不要求 session）
// 调用方必须自行保证调用是受信的：
//   - actions/leads.ts 的公共 server action：requireAdmin 后调
//   - 飞书回调路由：验证签名后调
//   - 内部脚本 / cron
// ─────────────────────────────────────────────────────────────

function statusLabel(s: LeadStatus): string {
  return LEAD_STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;
}

function priorityLabel(p: Priority): string {
  return PRIORITY_OPTIONS.find((o) => o.value === p)?.label ?? p;
}

function revalidateLeadPaths(leadId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/leads");
  revalidatePath("/admin/leads/kanban");
  revalidatePath("/admin/todos");
  revalidatePath(`/admin/leads/${leadId}`);
}

export interface MutationResult<T = unknown> {
  ok: true;
  unchanged: boolean;
  data?: T;
}

export async function changeLeadStatusInternal(
  leadId: string,
  status: LeadStatus,
  actor: string,
): Promise<MutationResult> {
  const [current] = await db
    .select({ id: leads.id, status: leads.status })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);
  if (!current) throw new Error("Lead not found");
  if (current.status === status) return { ok: true, unchanged: true };

  await db.transaction(async (tx) => {
    await tx.update(leads).set({ status, updatedAt: new Date() }).where(eq(leads.id, leadId));
    await tx.insert(leadActivities).values({
      leadId,
      type: "STATUS_CHANGE",
      content: `状态：${statusLabel(current.status)} → ${statusLabel(status)}`,
      actor,
    });
  });

  revalidateLeadPaths(leadId);
  void pushBitableSilent(leadId);
  return { ok: true, unchanged: false };
}

export async function changeLeadPriorityInternal(
  leadId: string,
  priority: Priority,
  actor: string,
): Promise<MutationResult> {
  const [current] = await db
    .select({ id: leads.id, priority: leads.priority })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);
  if (!current) throw new Error("Lead not found");
  if (current.priority === priority) return { ok: true, unchanged: true };

  await db.transaction(async (tx) => {
    await tx.update(leads).set({ priority, updatedAt: new Date() }).where(eq(leads.id, leadId));
    await tx.insert(leadActivities).values({
      leadId,
      type: "PRIORITY_CHANGE",
      content: `优先级：${priorityLabel(current.priority)} → ${priorityLabel(priority)}`,
      actor,
    });
  });

  revalidateLeadPaths(leadId);
  void pushBitableSilent(leadId);
  return { ok: true, unchanged: false };
}

export async function addLeadNoteInternal(
  leadId: string,
  content: string,
  actor: string,
  nextFollowUpAt?: Date | null,
): Promise<MutationResult> {
  await db.transaction(async (tx) => {
    await tx.insert(leadNotes).values({
      leadId,
      content,
      nextFollowUpAt: nextFollowUpAt ?? null,
    });
    await tx.insert(leadActivities).values({
      leadId,
      type: "NOTE_ADDED",
      content: content.length > 80 ? `${content.slice(0, 80)}…` : content,
      actor,
    });
  });
  revalidateLeadPaths(leadId);
  return { ok: true, unchanged: false };
}

/**
 * 标记某条 lead_note 的待办为已完成。
 * - 已完成的再次调用：返回 unchanged
 * - nextFollowUpAt 为空（即不是待办）的 note：返回 unchanged
 * - 不存在的 note：throw
 * 同步写一条 NOTE_COMPLETED 活动；revalidate /admin/todos 与详情页。
 */
export async function completeLeadNoteInternal(
  noteId: string,
  actor: string,
): Promise<MutationResult> {
  const [current] = await db
    .select({
      id: leadNotes.id,
      leadId: leadNotes.leadId,
      content: leadNotes.content,
      nextFollowUpAt: leadNotes.nextFollowUpAt,
      completedAt: leadNotes.completedAt,
    })
    .from(leadNotes)
    .where(eq(leadNotes.id, noteId))
    .limit(1);

  if (!current) throw new Error("Note not found");
  if (current.completedAt) return { ok: true, unchanged: true };
  if (!current.nextFollowUpAt) return { ok: true, unchanged: true }; // 不是待办

  const now = new Date();
  const summary =
    current.content.length > 60 ? `${current.content.slice(0, 60)}…` : current.content;

  await db.transaction(async (tx) => {
    await tx
      .update(leadNotes)
      .set({ completedAt: now, completedBy: actor })
      .where(eq(leadNotes.id, noteId));
    await tx.insert(leadActivities).values({
      leadId: current.leadId,
      type: "NOTE_COMPLETED",
      content: `完成跟进：${summary}`,
      actor,
    });
  });

  revalidateLeadPaths(current.leadId);
  return { ok: true, unchanged: false };
}

export async function archiveLeadInternal(leadId: string, actor: string): Promise<MutationResult> {
  const [current] = await db
    .select({ id: leads.id, status: leads.status })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);
  if (!current) throw new Error("Lead not found");
  if (current.status === "ARCHIVED") return { ok: true, unchanged: true };

  await db.transaction(async (tx) => {
    await tx
      .update(leads)
      .set({ status: "ARCHIVED", updatedAt: new Date() })
      .where(eq(leads.id, leadId));
    await tx.insert(leadActivities).values({
      leadId,
      type: "STATUS_CHANGE",
      content: `归档：${statusLabel(current.status)} → ${statusLabel("ARCHIVED")}`,
      actor,
    });
  });

  revalidateLeadPaths(leadId);
  void pushBitableSilent(leadId);
  return { ok: true, unchanged: false };
}
