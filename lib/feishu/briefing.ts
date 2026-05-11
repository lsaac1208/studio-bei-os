import type { BusinessType, LeadStatus } from "@/db/schema";
import { LEAD_STATUS_OPTIONS } from "@/lib/lead-options";
import {
  getWeeklyLeadStats,
  listPendingTodos,
  type PendingTodo,
  type WeeklyLeadStats,
} from "@/lib/queries/leads";
import { hasFeishuChannel, type SendFeishuCardResult, sendFeishuCard } from "./send";

const BJ_OFFSET_MS = 8 * 3600 * 1000;

const BUSINESS_LABEL: Record<BusinessType, string> = {
  APPOINTMENT: "预约 / 排期",
  ORDER_INVENTORY: "订单 / 库存",
  WEBSITE_CRM: "官网 / 询盘",
  CUSTOM: "定制系统",
};

function statusLabel(s: LeadStatus): string {
  return LEAD_STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;
}

function startOfBeijingDay(d: Date): number {
  const local = new Date(d.getTime() + BJ_OFFSET_MS);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const day = local.getUTCDate();
  return Date.UTC(y, m, day, 0, 0, 0, 0) - BJ_OFFSET_MS;
}

function fmtBeijingDate(ms: number): string {
  // YYYY-MM-DD（北京时间）
  const local = new Date(ms + BJ_OFFSET_MS);
  const y = local.getUTCFullYear();
  const m = String(local.getUTCMonth() + 1).padStart(2, "0");
  const d = String(local.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fmtBeijingTime(ms: number): string {
  // MM-DD HH:mm（北京时间）
  const local = new Date(ms + BJ_OFFSET_MS);
  const m = String(local.getUTCMonth() + 1).padStart(2, "0");
  const d = String(local.getUTCDate()).padStart(2, "0");
  const hh = String(local.getUTCHours()).padStart(2, "0");
  const mm = String(local.getUTCMinutes()).padStart(2, "0");
  return `${m}-${d} ${hh}:${mm}`;
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

// ─────────────────────────────────────────────────────────────
// 日报：今日待办（逾期 + 今天 + 明天 7 条预告）
// ─────────────────────────────────────────────────────────────

export interface DailyBriefingData {
  /** 当前北京日期 yyyy-mm-dd */
  date: string;
  /** 逾期未完成 */
  overdue: PendingTodo[];
  /** 今天到期未完成 */
  today: PendingTodo[];
  /** 明天到期（预告） */
  tomorrow: PendingTodo[];
}

export function buildDailyBriefingData(
  todos: PendingTodo[],
  now: Date = new Date(),
): DailyBriefingData {
  const todayStart = startOfBeijingDay(now);
  const tomorrowStart = todayStart + 24 * 3600 * 1000;
  const dayAfter = todayStart + 2 * 24 * 3600 * 1000;
  const nowMs = now.getTime();

  const overdue: PendingTodo[] = [];
  const today: PendingTodo[] = [];
  const tomorrow: PendingTodo[] = [];

  for (const t of todos) {
    const ts = t.nextFollowUpAt.getTime();
    if (ts < nowMs) overdue.push(t);
    else if (ts < tomorrowStart) today.push(t);
    else if (ts < dayAfter) tomorrow.push(t);
  }
  return { date: fmtBeijingDate(todayStart), overdue, today, tomorrow };
}

export function renderDailyBriefingCard(data: DailyBriefingData, baseUrl: string) {
  const { date, overdue, today, tomorrow } = data;
  const total = overdue.length + today.length;
  const isEmpty = total === 0;

  // 卡片头：根据是否有逾期切色
  const headerTemplate = overdue.length > 0 ? "red" : total > 0 ? "orange" : "green";
  const headerTitle = isEmpty
    ? `☀️ ${date} · 今日没有待办`
    : `📋 ${date} · 今日待办 ${total} 条${overdue.length > 0 ? `（逾期 ${overdue.length}）` : ""}`;

  const elements: Record<string, unknown>[] = [];

  if (isEmpty) {
    elements.push({
      tag: "div",
      text: { tag: "lark_md", content: "今日和逾期均无待跟进线索 ☕️" },
    });
  } else {
    if (overdue.length > 0) {
      elements.push({
        tag: "div",
        text: {
          tag: "lark_md",
          content: `**🔴 逾期 ${overdue.length}**\n${formatTodoLines(overdue, baseUrl)}`,
        },
      });
    }
    if (today.length > 0) {
      elements.push({
        tag: "div",
        text: {
          tag: "lark_md",
          content: `**🟡 今天 ${today.length}**\n${formatTodoLines(today, baseUrl)}`,
        },
      });
    }
  }

  if (tomorrow.length > 0) {
    elements.push({ tag: "hr" });
    elements.push({
      tag: "div",
      text: {
        tag: "lark_md",
        content: `**明天预告 (${tomorrow.length})**\n${formatTodoLines(tomorrow.slice(0, 5), baseUrl)}${tomorrow.length > 5 ? `\n_…还有 ${tomorrow.length - 5} 条_` : ""}`,
      },
    });
  }

  elements.push({
    tag: "action",
    actions: [
      {
        tag: "button",
        text: { tag: "plain_text", content: "打开待办" },
        type: "primary",
        url: `${baseUrl}/admin/todos`,
      },
    ],
  });

  return {
    config: { wide_screen_mode: true, update_multi: true },
    header: { template: headerTemplate, title: { tag: "plain_text", content: headerTitle } },
    elements,
  };
}

function formatTodoLines(todos: PendingTodo[], baseUrl: string): string {
  // 单条：· [11-08 14:00] **客户名** [code]：备注摘要
  const MAX = 12;
  const lines = todos.slice(0, MAX).map((t) => {
    const time = fmtBeijingTime(t.nextFollowUpAt.getTime());
    const link = `[${t.leadName}](${baseUrl}/admin/leads/${t.leadId})`;
    const code = `\`${t.leadCode}\``;
    const summary = truncate(t.noteContent.replace(/\s+/g, " "), 40);
    return `· \`${time}\` ${link} ${code} ${summary}`;
  });
  if (todos.length > MAX) lines.push(`_…还有 ${todos.length - MAX} 条_`);
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────
// 周报：上周新增 / 转化 / 业务分布 + 当前状态分布
// ─────────────────────────────────────────────────────────────

export function renderWeeklyBriefingCard(stats: WeeklyLeadStats, baseUrl: string) {
  const { startMs, endMs, newLeads, converted, byBusiness, byStatus } = stats;
  // endMs 是 exclusive，展示时 -1ms 取上周日
  const startLabel = fmtBeijingDate(startMs);
  const endLabel = fmtBeijingDate(endMs - 24 * 3600 * 1000);
  const conversionRate = newLeads > 0 ? Math.round((converted / newLeads) * 100) : 0;

  const businessLine =
    byBusiness.length === 0
      ? "—"
      : byBusiness
          .map((b) => `${BUSINESS_LABEL[b.businessType] ?? b.businessType} \`${b.n}\``)
          .join(" · ");
  const statusLine =
    byStatus.length === 0
      ? "—"
      : byStatus.map((s) => `${statusLabel(s.status)} \`${s.n}\``).join(" · ");

  return {
    config: { wide_screen_mode: true, update_multi: true },
    header: {
      template: "blue",
      title: { tag: "plain_text", content: `📊 周报 · ${startLabel} ~ ${endLabel}` },
    },
    elements: [
      {
        tag: "div",
        fields: [
          {
            is_short: true,
            text: { tag: "lark_md", content: `**上周新增**\n${newLeads}` },
          },
          {
            is_short: true,
            text: { tag: "lark_md", content: `**已转化（≥已报价）**\n${converted}` },
          },
          {
            is_short: true,
            text: { tag: "lark_md", content: `**转化率**\n${conversionRate}%` },
          },
        ],
      },
      { tag: "hr" },
      {
        tag: "div",
        text: { tag: "lark_md", content: `**上周业务方向**\n${businessLine}` },
      },
      {
        tag: "div",
        text: { tag: "lark_md", content: `**当前状态分布**\n${statusLine}` },
      },
      {
        tag: "action",
        actions: [
          {
            tag: "button",
            text: { tag: "plain_text", content: "打开线索列表" },
            type: "primary",
            url: `${baseUrl}/admin/leads`,
          },
        ],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// 高层入口（给 cron 路由使用）
// ─────────────────────────────────────────────────────────────

export interface BriefingResult {
  ok: true;
  /** 是否实际发送了卡片（false = 通道未配置 / 当日无内容且 silentIfEmpty） */
  sent: boolean;
  /** 实际使用的飞书通道 */
  channel?: SendFeishuCardResult["channel"];
  /** 仅 app 通道返回 */
  messageId?: string;
  /** 简短日志，便于 cron 日志可读 */
  summary: string;
}

export interface SendDailyOptions {
  /** 没有任何待办时是否跳过发送（默认 false：仍发"今日没有待办"作为存活心跳） */
  silentIfEmpty?: boolean;
  /** 用于覆盖 baseUrl（默认读 NEXT_PUBLIC_SITE_URL） */
  baseUrl?: string;
}

export async function sendDailyBriefing(opts: SendDailyOptions = {}): Promise<BriefingResult> {
  if (!(await hasFeishuChannel())) {
    return { ok: true, sent: false, summary: "no feishu channel configured" };
  }

  const baseUrl = opts.baseUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const todos = await listPendingTodos();
  const data = buildDailyBriefingData(todos);
  const total = data.overdue.length + data.today.length;
  if (total === 0 && opts.silentIfEmpty) {
    return { ok: true, sent: false, summary: "no todos today, silent" };
  }
  const card = renderDailyBriefingCard(data, baseUrl);
  const r = await sendFeishuCard(card);
  return {
    ok: true,
    sent: r.channel !== "none",
    channel: r.channel,
    messageId: r.messageId,
    summary: `daily: overdue=${data.overdue.length} today=${data.today.length} tomorrow=${data.tomorrow.length}`,
  };
}

export async function sendWeeklyBriefing(opts: { baseUrl?: string } = {}): Promise<BriefingResult> {
  if (!(await hasFeishuChannel())) {
    return { ok: true, sent: false, summary: "no feishu channel configured" };
  }
  const baseUrl = opts.baseUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const stats = await getWeeklyLeadStats();
  const card = renderWeeklyBriefingCard(stats, baseUrl);
  const r = await sendFeishuCard(card);
  return {
    ok: true,
    sent: r.channel !== "none",
    channel: r.channel,
    messageId: r.messageId,
    summary: `weekly: new=${stats.newLeads} converted=${stats.converted}`,
  };
}
