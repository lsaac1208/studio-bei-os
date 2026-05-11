import type { Lead } from "@/db/schema";
import { renderNewLeadCard } from "./cards";
import { feishuClient } from "./client";
import { sendFeishuCard } from "./send";

/**
 * 推送新线索通知。返回 message_id（仅企业自建应用通道返回；
 * 自定义机器人 webhook 通道返回 undefined）。
 */
export async function notifyNewLead(lead: Lead): Promise<string | undefined> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const card = renderNewLeadCard(lead, baseUrl);
  try {
    const r = await sendFeishuCard(card);
    return r.messageId;
  } catch (err) {
    console.error("[feishu] notifyNewLead failed", err);
    return undefined;
  }
}

/**
 * 状态变更后刷新已发出的卡片（仅 receive_id 通道）。
 */
export async function refreshLeadCard(messageId: string, lead: Lead): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const card = renderNewLeadCard(lead, baseUrl);
  await feishuClient.im.message.patch({
    path: { message_id: messageId },
    data: { content: JSON.stringify(card) },
  });
}
