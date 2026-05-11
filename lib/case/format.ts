/**
 * 案例 demo 共享格式化工具（迁自 beta02/app.js）
 * 三个案例（栖光 / 麦研所 / 恒越）都用得到，独立成 lib。
 */

const WEEK_LABEL = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export const addDays = (days: number, base: Date = new Date()): string => {
  const date = new Date(base);
  date.setDate(base.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export const formatDate = (value?: string): string => {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
};

export const formatDateShort = (value?: string): string => {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${m}/${d} ${WEEK_LABEL[date.getDay()]}`;
};

export const formatMoney = (value: number | string | null | undefined): string =>
  `¥${Math.round(Number(value || 0)).toLocaleString("zh-CN")}`;

export const formatMoneyShort = (value: number | string | null | undefined): string => {
  const v = Math.round(Number(value || 0));
  if (v >= 10000) return `¥${(v / 10000).toFixed(1)}w`;
  return `¥${v.toLocaleString("zh-CN")}`;
};

export const uid = (prefix: string): string => {
  const ts = Date.now().toString(36).slice(-5);
  const rand = Math.random().toString(36).slice(2, 5);
  return `${prefix}${ts}${rand}`.toUpperCase();
};

export const STATUS_TEXT: Record<string, string> = {
  pending: "待确认",
  confirmed: "已确认",
  completed: "已完成",
  cancelled: "已取消",
  paid: "待发货",
  shipped: "运送中",
  hot: "高意向",
  medium: "中意向",
  following: "跟进中",
  new: "新询盘",
  closed: "已成交",
  ok: "正常",
  low: "低库存",
  out: "缺货",
};
