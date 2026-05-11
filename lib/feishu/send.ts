import { getSetting } from "@/lib/settings";
import { feishuClient } from "./client";

/**
 * 通用：把一个交互式卡片对象发送到当前配置的飞书通道。
 *
 * 三个通道按优先级：
 *   1. notify.feishuBotWebhook （自建群机器人 webhook，部署最简单；返回 messageId=undefined）
 *   2. notify.feishuReceiverOpenId （企业自建应用推到个人）
 *   3. notify.feishuChatId （企业自建应用推到群）
 *
 * 通道 2/3 需 FEISHU_APP_ID + FEISHU_APP_SECRET 环境变量。
 *
 * 返回：
 *   - channel: 实际使用的通道（"none" 表示三个都没配，调用方应当 NOOP）
 *   - messageId: 仅 app 通道返回；webhook / none 为 undefined
 */
export type FeishuChannel = "webhook" | "app" | "none";

export interface SendFeishuCardResult {
  channel: FeishuChannel;
  messageId?: string;
}

export async function sendFeishuCard(card: unknown): Promise<SendFeishuCardResult> {
  const webhook = await getSetting("notify.feishuBotWebhook");
  if (webhook) {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ msg_type: "interactive", card }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Feishu webhook failed: ${res.status} ${text}`);
    }
    return { channel: "webhook" };
  }

  const openId = await getSetting("notify.feishuReceiverOpenId");
  const chatId = await getSetting("notify.feishuChatId");
  if (!openId && !chatId) return { channel: "none" };
  if (!process.env.FEISHU_APP_ID || !process.env.FEISHU_APP_SECRET) {
    throw new Error("FEISHU_APP_ID/SECRET 未配置但 receive_id 已设置");
  }

  const res = await feishuClient.im.message.create({
    params: { receive_id_type: openId ? "open_id" : "chat_id" },
    data: {
      receive_id: (openId ?? chatId) as string,
      msg_type: "interactive",
      content: JSON.stringify(card),
    },
  });
  return { channel: "app", messageId: res.data?.message_id };
}

/**
 * 是否已配置任意一个飞书通道。
 * 用于 cron 路由前置判断 — 没配就直接返回，不报错。
 */
export async function hasFeishuChannel(): Promise<boolean> {
  const [webhook, openId, chatId] = await Promise.all([
    getSetting("notify.feishuBotWebhook"),
    getSetting("notify.feishuReceiverOpenId"),
    getSetting("notify.feishuChatId"),
  ]);
  return Boolean(webhook || openId || chatId);
}
