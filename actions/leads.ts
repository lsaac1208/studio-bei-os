"use server";

import { z } from "zod";
import { type LeadStatus, leadStatusEnum, type Priority, priorityEnum } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-server";
import {
  addLeadNoteInternal,
  archiveLeadInternal,
  changeLeadPriorityInternal,
  changeLeadStatusInternal,
  completeLeadNoteInternal,
} from "@/lib/leads-mutations";

// ─────────────────────────────────────────────────────────────
// 公共 server actions（来自客户端 RPC）
// 全部 requireAdmin → 转 internal helper
// 真正的写库逻辑在 lib/leads-mutations.ts，飞书回调等受信路径直接调那里
// ─────────────────────────────────────────────────────────────

const ChangeStatusInput = z.object({
  id: z.string().min(1),
  status: z.enum(leadStatusEnum.enumValues),
});

export async function changeLeadStatus(input: { id: string; status: LeadStatus }) {
  const parsed = ChangeStatusInput.parse(input);
  const session = await requireAdmin();
  return changeLeadStatusInternal(parsed.id, parsed.status, session.user.id);
}

const ChangePriorityInput = z.object({
  id: z.string().min(1),
  priority: z.enum(priorityEnum.enumValues),
});

export async function changeLeadPriority(input: { id: string; priority: Priority }) {
  const parsed = ChangePriorityInput.parse(input);
  const session = await requireAdmin();
  return changeLeadPriorityInternal(parsed.id, parsed.priority, session.user.id);
}

const AddNoteInput = z.object({
  leadId: z.string().min(1),
  content: z.string().trim().min(1, "备注不能为空").max(2000, "备注最多 2000 字"),
  nextFollowUpAt: z.string().datetime().optional(),
});

export async function addLeadNote(input: {
  leadId: string;
  content: string;
  nextFollowUpAt?: string;
}) {
  const parsed = AddNoteInput.parse(input);
  const session = await requireAdmin();
  return addLeadNoteInternal(
    parsed.leadId,
    parsed.content,
    session.user.id,
    parsed.nextFollowUpAt ? new Date(parsed.nextFollowUpAt) : null,
  );
}

const CompleteNoteInput = z.object({ noteId: z.string().min(1) });

export async function completeLeadNote(input: { noteId: string }) {
  const parsed = CompleteNoteInput.parse(input);
  const session = await requireAdmin();
  return completeLeadNoteInternal(parsed.noteId, session.user.id);
}

const ArchiveInput = z.object({ id: z.string().min(1) });

export async function archiveLead(input: { id: string }) {
  const parsed = ArchiveInput.parse(input);
  const session = await requireAdmin();
  return archiveLeadInternal(parsed.id, session.user.id);
}
