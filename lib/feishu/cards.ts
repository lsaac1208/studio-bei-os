import type { Lead } from "@/db/schema";

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

const businessLabel: Record<string, string> = {
  APPOINTMENT: "预约 / 排期",
  ORDER_INVENTORY: "订单 / 库存",
  WEBSITE_CRM: "官网 / 询盘",
  CUSTOM: "定制系统",
};

const budgetLabel: Record<string, string> = {
  UNDER_3K: "≤ 3,000",
  R_3K_8K: "3,000 – 8,000",
  R_8K_20K: "8,000 – 20,000",
  OVER_20K: "≥ 20,000",
  UNSURE: "未定",
};

const timelineLabel: Record<string, string> = {
  WITHIN_2W: "两周内",
  WITHIN_1M: "一个月内",
  WITHIN_3M: "三个月内",
  UNSURE: "未定",
};

/**
 * 新线索通知卡片（飞书交互式卡片 v2）。
 * 在线编辑器：https://open.feishu.cn/cardkit
 */
export function renderNewLeadCard(lead: Lead, baseUrl: string) {
  const contact = lead.wechat ?? lead.phone ?? lead.email ?? "—";
  return {
    config: { wide_screen_mode: true, update_multi: true },
    header: {
      template: "red",
      title: { tag: "plain_text", content: `🆕 新线索 · ${lead.name}（${lead.code}）` },
    },
    elements: [
      {
        tag: "div",
        fields: [
          {
            is_short: true,
            text: { tag: "lark_md", content: `**业务**\n${businessLabel[lead.businessType]}` },
          },
          {
            is_short: true,
            text: { tag: "lark_md", content: `**预算**\n${budgetLabel[lead.budgetRange]}` },
          },
          {
            is_short: true,
            text: {
              tag: "lark_md",
              content: `**时间**\n${lead.timeline ? timelineLabel[lead.timeline] : "—"}`,
            },
          },
          { is_short: true, text: { tag: "lark_md", content: `**联系**\n${contact}` } },
        ],
      },
      { tag: "div", text: { tag: "lark_md", content: `**需求**\n${truncate(lead.message, 200)}` } },
      {
        tag: "action",
        actions: [
          {
            tag: "button",
            text: { tag: "plain_text", content: "标记已联系" },
            type: "primary",
            value: { action: "contacted", leadId: lead.id },
          },
          {
            tag: "button",
            text: { tag: "plain_text", content: "设高优先级" },
            type: "default",
            value: { action: "prioritize", leadId: lead.id },
          },
          {
            tag: "button",
            text: { tag: "plain_text", content: "打开后台" },
            type: "default",
            url: `${baseUrl}/admin/leads/${lead.id}`,
          },
        ],
      },
    ],
  };
}
