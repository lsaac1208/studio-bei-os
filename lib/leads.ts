import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { type Lead, leadActivities, leads } from "@/db/schema";
import { isBitableEnabled, pushLeadToBitable } from "@/lib/feishu/bitable";
import { notifyNewLead } from "@/lib/feishu/bot";
import { genLeadCode } from "@/lib/lead-code";
import type { LeadCreateInput } from "@/lib/validators";

// 为既有调用方保留 `@/lib/leads` 路径
export { genLeadCode } from "@/lib/lead-code";

/**
 * 把通过校验的表单数据写入 leads + leadActivities。
 * - 线索 code 自动生成
 * - 同事务追加一条 CREATE 类型 activity（M7 时间线起点）
 * - 飞书通知由 M8 监听 leadCreated 事件触发，这里只负责落库
 */
export async function insertLead(
  input: LeadCreateInput,
  meta: { ip?: string; userAgent?: string; referer?: string },
): Promise<Lead> {
  const code = genLeadCode();
  const sourceParts = [
    meta.referer ? `referer=${meta.referer}` : null,
    meta.ip ? `ip=${meta.ip}` : null,
    meta.userAgent ? `ua=${meta.userAgent.slice(0, 120)}` : null,
  ].filter(Boolean);

  const inserted = await db
    .insert(leads)
    .values({
      code,
      name: input.name,
      wechat: input.wechat || null,
      phone: input.phone || null,
      email: input.email || null,
      businessType: input.businessType,
      budgetRange: input.budgetRange,
      timeline: input.timeline ?? null,
      painPoint: input.painPoint || null,
      message: input.message,
      source: input.source || sourceParts.join(" · ") || null,
    })
    .returning();

  const lead = inserted[0];
  if (!lead) throw new Error("Failed to insert lead");

  await db.insert(leadActivities).values({
    leadId: lead.id,
    type: "CREATE",
    content: "通过官网需求表单创建",
    actor: "system",
  });

  // 飞书通知（不阻塞表单响应：失败仅写日志，成功则回写 message_id）
  void dispatchLeadCreated(lead);
  // 飞书多维表格同步（best-effort，与上面通知互不阻塞）
  void dispatchBitableSync(lead);

  return lead;
}

async function dispatchLeadCreated(lead: Lead): Promise<void> {
  try {
    const messageId = await notifyNewLead(lead);
    if (messageId) {
      await db
        .update(leads)
        .set({ feishuMessageId: messageId, updatedAt: new Date() })
        .where(eq(leads.id, lead.id));
    }
  } catch (err) {
    console.error("[leadCreated] feishu notify failed", err);
  }
}

async function dispatchBitableSync(lead: Lead): Promise<void> {
  try {
    if (!(await isBitableEnabled())) return;
    const { recordId } = await pushLeadToBitable(lead);
    await db
      .update(leads)
      .set({ bitableRecordId: recordId, bitableSyncedAt: new Date() })
      .where(eq(leads.id, lead.id));
  } catch (err) {
    console.warn(`[bitable] new lead ${lead.id} push failed:`, err);
  }
}
