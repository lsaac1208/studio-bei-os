import "server-only";
import type { Lead } from "@/db/schema";
import {
  BUDGET_OPTIONS,
  BUSINESS_TYPE_OPTIONS,
  LEAD_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  TIMELINE_OPTIONS,
} from "@/lib/lead-options";

// ─────────────────────────────────────────────────────────────
// 通用 CSV 序列化
// 转义规则（RFC 4180）：
//   - 含 ,/"/换行 的字段用 " 包裹
//   - " 重复一次为 ""
// 行分隔符：CRLF（Excel 兼容）
// ─────────────────────────────────────────────────────────────

export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function rowsToCSV(headers: string[], rows: Array<Array<unknown>>): string {
  const head = headers.map(escapeCsvCell).join(",");
  const body = rows.map((r) => r.map(escapeCsvCell).join(",")).join("\r\n");
  // BOM 让 Excel/WPS 自动识别 UTF-8
  return `\uFEFF${head}\r\n${body}`;
}

// ─────────────────────────────────────────────────────────────
// 业务：leads 行 -> CSV
// ─────────────────────────────────────────────────────────────

const labelOf = <T extends string>(
  options: ReadonlyArray<{ value: T; label: string }>,
  v: T | null | undefined,
): string => (v ? (options.find((o) => o.value === v)?.label ?? v) : "");

const fmtDateCN = (d: Date | null | undefined): string => {
  if (!d) return "";
  // 中国时区（UTC+8）格式化为 YYYY-MM-DD HH:mm
  const z = new Date(d.getTime() + 8 * 3600 * 1000);
  const yyyy = z.getUTCFullYear();
  const mm = String(z.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(z.getUTCDate()).padStart(2, "0");
  const hh = String(z.getUTCHours()).padStart(2, "0");
  const mi = String(z.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
};

export function leadsToCSV(leadsRows: Lead[]): string {
  const headers = [
    "编号",
    "客户姓名",
    "微信",
    "手机",
    "邮箱",
    "业务方向",
    "预算",
    "期望时间",
    "状态",
    "优先级",
    "痛点",
    "需求描述",
    "来源",
    "创建时间",
    "更新时间",
  ];

  const rows = leadsRows.map((l) => [
    l.code,
    l.name,
    l.wechat ?? "",
    l.phone ?? "",
    l.email ?? "",
    labelOf(BUSINESS_TYPE_OPTIONS, l.businessType),
    labelOf(BUDGET_OPTIONS, l.budgetRange),
    labelOf(TIMELINE_OPTIONS, l.timeline),
    labelOf(LEAD_STATUS_OPTIONS, l.status),
    labelOf(PRIORITY_OPTIONS, l.priority),
    l.painPoint ?? "",
    l.message,
    l.source ?? "",
    fmtDateCN(l.createdAt),
    fmtDateCN(l.updatedAt),
  ]);

  return rowsToCSV(headers, rows);
}
