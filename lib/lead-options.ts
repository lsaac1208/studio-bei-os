/**
 * 表单可视选项（label 中文化）。
 * 与 db/schema.ts 的 pgEnum + lib/validators.ts 的 zod enum 保持值一致。
 */

import type { BudgetRange, BusinessType, LeadStatus, Priority, Timeline } from "@/db/schema";

export const BUSINESS_TYPE_OPTIONS: Array<{ value: BusinessType; label: string; hint: string }> = [
  { value: "APPOINTMENT", label: "预约 / 排期系统", hint: "门店、工作室、诊所" },
  { value: "ORDER_INVENTORY", label: "订单 / 库存系统", hint: "作坊、电商、批发" },
  { value: "WEBSITE_CRM", label: "官网 / 询盘 CRM", hint: "B2B 工厂、外贸、咨询" },
  { value: "CUSTOM", label: "定制 / 流程自动化", hint: "复杂业务、内部工具" },
];

export const BUDGET_OPTIONS: Array<{ value: BudgetRange; label: string }> = [
  { value: "UNDER_3K", label: "3000 元以下" },
  { value: "R_3K_8K", label: "3000 — 8000 元" },
  { value: "R_8K_20K", label: "8000 — 20000 元" },
  { value: "OVER_20K", label: "20000 元以上" },
  { value: "UNSURE", label: "暂时不确定，先聊一聊" },
];

export const TIMELINE_OPTIONS: Array<{ value: Timeline; label: string }> = [
  { value: "WITHIN_2W", label: "2 周内希望开工" },
  { value: "WITHIN_1M", label: "1 个月内" },
  { value: "WITHIN_3M", label: "3 个月内" },
  { value: "UNSURE", label: "时间灵活" },
];

export const LEAD_STATUS_OPTIONS: Array<{
  value: LeadStatus;
  label: string;
  tone: "info" | "ok" | "warn" | "bad" | "mute";
}> = [
  { value: "NEW", label: "待处理", tone: "warn" },
  { value: "CONTACTED", label: "已联系", tone: "info" },
  { value: "QUALIFYING", label: "需求确认", tone: "info" },
  { value: "QUOTED", label: "已报价", tone: "info" },
  { value: "WON", label: "成交", tone: "ok" },
  { value: "LOST", label: "丢单", tone: "bad" },
  { value: "ARCHIVED", label: "归档", tone: "mute" },
];

export const PRIORITY_OPTIONS: Array<{ value: Priority; label: string }> = [
  { value: "LOW", label: "低" },
  { value: "NORMAL", label: "普通" },
  { value: "HIGH", label: "高" },
];
