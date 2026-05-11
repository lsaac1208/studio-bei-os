/**
 * Settings key 白名单。
 * 只有列在这里的 key 才能通过 actions/settings.ts::updateSettings 写入。
 *
 * 设计：与后台「设置」页 UI 的分组一一对应，避免任意 key 注入。
 */

export const CONTACT_KEYS = [
  "contact.wechatId",
  "contact.wechatQrUrl",
  "contact.publicEmail",
  "contact.promiseHours",
] as const;

export const NOTIFY_KEYS = [
  "notify.feishuBotWebhook",
  "notify.feishuReceiverOpenId",
  "notify.feishuChatId",
] as const;

export const BITABLE_KEYS = [
  "bitable.appToken",
  "bitable.tableId",
  "bitable.viewIdSearch",
] as const;

export const SETTING_KEYS: readonly string[] = [...CONTACT_KEYS, ...NOTIFY_KEYS, ...BITABLE_KEYS];

export type ContactKey = (typeof CONTACT_KEYS)[number];
export type NotifyKey = (typeof NOTIFY_KEYS)[number];
export type BitableKey = (typeof BITABLE_KEYS)[number];
export type SettingKey = ContactKey | NotifyKey | BitableKey;

/**
 * 字段元信息，供后台 UI 渲染用。
 */
export interface SettingFieldMeta {
  key: SettingKey;
  label: string;
  placeholder?: string;
  hint?: string;
  type: "text" | "url" | "email" | "number";
  /** 输入框行数，大于 1 则渲染 textarea */
  rows?: number;
}

export const CONTACT_FIELDS: SettingFieldMeta[] = [
  {
    key: "contact.wechatId",
    label: "微信号",
    placeholder: "your_wechat_id",
    hint: "官网「联系方式」与感谢页展示",
    type: "text",
  },
  {
    key: "contact.wechatQrUrl",
    label: "微信二维码 URL",
    placeholder: "https://blob.vercel.../wechat-qr.png",
    hint: "二维码图片的外链；M9 只接受 URL，M10 或后续接图床",
    type: "url",
  },
  {
    key: "contact.publicEmail",
    label: "公开邮箱",
    placeholder: "hello@studio-bei.com",
    hint: "仅在页脚展示；业务沟通主力走微信",
    type: "email",
  },
  {
    key: "contact.promiseHours",
    label: "承诺联系时限（小时）",
    placeholder: "24",
    hint: "感谢页「xxx 小时内联系你」的数字",
    type: "number",
  },
];

export const NOTIFY_FIELDS: SettingFieldMeta[] = [
  {
    key: "notify.feishuBotWebhook",
    label: "飞书群自定义机器人 Webhook",
    placeholder: "https://open.feishu.cn/open-apis/bot/v2/hook/xxx",
    hint: "通道 A：配置后新线索直推群；按钮无法回调",
    type: "url",
  },
  {
    key: "notify.feishuChatId",
    label: "飞书群 chat_id",
    placeholder: "oc_xxxxx",
    hint: "通道 B 之一：企业自建应用推到此群；按钮可回调",
    type: "text",
  },
  {
    key: "notify.feishuReceiverOpenId",
    label: "飞书接收人 open_id",
    placeholder: "ou_xxxxx",
    hint: "通道 B 之二：企业自建应用推到个人；二者择一即可",
    type: "text",
  },
];

export const BITABLE_FIELDS: SettingFieldMeta[] = [
  {
    key: "bitable.appToken",
    label: "多维表格 app_token",
    placeholder: "bascnxxxxxxxxxxxxx",
    hint: "在飞书多维表格 URL 中：feishu.cn/base/{app_token}",
    type: "text",
  },
  {
    key: "bitable.tableId",
    label: "多维表格 table_id",
    placeholder: "tblxxxxxxxxxxx",
    hint: "URL 参数 ?table=xxx；表头需包含：编号 / 姓名 / 微信 / 电话 / 邮箱 / 业务类型 / 预算 / 时间 / 痛点 / 需求 / 来源 / 状态 / 优先级 / 提交时间 / 后台链接",
    type: "text",
  },
  {
    key: "bitable.viewIdSearch",
    label: "拉取使用的 view_id（可选）",
    placeholder: "vewxxxxxxxxxx",
    hint: "留空则全表；指定视图可避免拉取归档数据",
    type: "text",
  },
];
