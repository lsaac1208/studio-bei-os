import "server-only";

import type { Lead } from "@/db/schema";
import { getSetting } from "@/lib/settings";
import { feishuClient } from "./client";

/**
 * 飞书多维表格（Bitable）双向同步客户端。
 *
 * 字段约定（Bitable 端建表时字段名必须完全一致；中文字段在飞书侧最直观）：
 *  - 编号 / 姓名 / 微信 / 电话 / 邮箱
 *  - 业务类型 / 预算 / 时间 / 痛点 / 需求 / 来源
 *  - 状态 / 优先级 / 提交时间 / 后台链接
 *
 * 建议字段类型：
 *  - 状态、优先级、业务类型、预算、时间：单选
 *  - 提交时间：日期时间（毫秒时间戳）
 *  - 后台链接：URL
 *  - 其他：单/多行文本
 *
 * 配置来源：settings 表
 *  - bitable.appToken
 *  - bitable.tableId
 *  - bitable.viewIdSearch（可选，pull 时按视图筛选）
 *
 * 鉴权：复用 FEISHU_APP_ID / FEISHU_APP_SECRET（与 send.ts 共用）。
 *
 * 失败策略：
 *  - push：在 mutations 调用方 try/catch，best-effort，靠 cron 自愈
 *  - pull：cron 出错只 log，不影响下次重试
 */

// ─────────────────────────────────────────────────────────────
// 配置
// ─────────────────────────────────────────────────────────────

export interface BitableConfig {
  appToken: string;
  tableId: string;
  viewIdSearch?: string;
}

export async function getBitableConfig(): Promise<BitableConfig | null> {
  const [appToken, tableId, viewIdSearch] = await Promise.all([
    getSetting("bitable.appToken"),
    getSetting("bitable.tableId"),
    getSetting("bitable.viewIdSearch"),
  ]);
  if (!appToken || !tableId) return null;
  if (!process.env.FEISHU_APP_ID || !process.env.FEISHU_APP_SECRET) return null;
  return { appToken, tableId, viewIdSearch: viewIdSearch || undefined };
}

export async function isBitableEnabled(): Promise<boolean> {
  return Boolean(await getBitableConfig());
}

// ─────────────────────────────────────────────────────────────
// 字段映射
// ─────────────────────────────────────────────────────────────

const BUSINESS_TYPE_LABEL: Record<string, string> = {
  APPOINTMENT: "预约 / 排期",
  ORDER_INVENTORY: "订单 / 库存",
  WEBSITE_CRM: "官网 / 询盘",
  CUSTOM: "定制系统",
};

const BUDGET_LABEL: Record<string, string> = {
  UNDER_3K: "< ¥3,000",
  R_3K_8K: "¥3K — ¥8K",
  R_8K_20K: "¥8K — ¥20K",
  OVER_20K: "> ¥20,000",
  UNSURE: "未定",
};

const TIMELINE_LABEL: Record<string, string> = {
  WITHIN_2W: "2 周内",
  WITHIN_1M: "1 个月内",
  WITHIN_3M: "3 个月内",
  UNSURE: "未定",
};

export const STATUS_LABEL: Record<string, string> = {
  NEW: "新线索",
  CONTACTED: "已联系",
  QUALIFYING: "需求确认",
  QUOTED: "已报价",
  WON: "已成交",
  LOST: "未成交",
  ARCHIVED: "已归档",
};

const STATUS_INVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(STATUS_LABEL).map(([k, v]) => [v, k]),
);

export const PRIORITY_LABEL: Record<string, string> = {
  LOW: "低",
  NORMAL: "中",
  HIGH: "高",
};

const PRIORITY_INVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(PRIORITY_LABEL).map(([k, v]) => [v, k]),
);

const ADMIN_BASE = process.env.ADMIN_BASE_URL || "https://100yse.com";

/**
 * 把本地 lead → bitable fields 对象。
 * undefined / 空字段一律不写出（避免覆盖 bitable 上的手工备注）。
 */
function leadToBitableFields(lead: Lead): Record<string, unknown> {
  const f: Record<string, unknown> = {
    编号: lead.code,
    姓名: lead.name,
    业务类型: BUSINESS_TYPE_LABEL[lead.businessType] ?? lead.businessType,
    预算: BUDGET_LABEL[lead.budgetRange] ?? lead.budgetRange,
    需求: lead.message,
    状态: STATUS_LABEL[lead.status] ?? lead.status,
    优先级: PRIORITY_LABEL[lead.priority] ?? lead.priority,
    提交时间: lead.createdAt.getTime(),
    后台链接: { link: `${ADMIN_BASE}/admin/leads/${lead.id}`, text: "打开后台" },
  };
  if (lead.wechat) f.微信 = lead.wechat;
  if (lead.phone) f.电话 = lead.phone;
  if (lead.email) f.邮箱 = lead.email;
  if (lead.timeline) f.时间 = TIMELINE_LABEL[lead.timeline] ?? lead.timeline;
  if (lead.painPoint) f.痛点 = lead.painPoint;
  if (lead.source) f.来源 = lead.source;
  return f;
}

// ─────────────────────────────────────────────────────────────
// 类型定义（lark sdk 返回类型很复杂，我们只关心子集）
// ─────────────────────────────────────────────────────────────

interface BitableRecord {
  record_id: string;
  fields: Record<string, unknown>;
  last_modified_time?: number;
}

interface SearchResult {
  has_more: boolean;
  page_token?: string;
  total: number;
  items: BitableRecord[];
}

// ─────────────────────────────────────────────────────────────
// Push: lead → bitable
// ─────────────────────────────────────────────────────────────

/**
 * 把一条 lead 推到 bitable。
 *  - 若 lead.bitableRecordId 已有 → update
 *  - 否则 → create，返回新 record_id
 *
 * 调用方应在成功后把 recordId / synced_at 写回数据库。
 *
 * 抛错时调用方应捕获，不要让推送失败阻塞主流程。
 */
export async function pushLeadToBitable(
  lead: Lead,
): Promise<{ recordId: string; created: boolean }> {
  const cfg = await getBitableConfig();
  if (!cfg) throw new Error("bitable 未配置");

  const fields = leadToBitableFields(lead);

  // SDK fields 类型为巨大联合类型；运行时只接 JSON 序列化值。
  //   biome-ignore lint/suspicious/noExplicitAny: SDK 类型与实际接受的 JSON 不一致
  const fieldsAny = fields as any;

  if (lead.bitableRecordId) {
    await feishuClient.bitable.v1.appTableRecord.update({
      path: { app_token: cfg.appToken, table_id: cfg.tableId, record_id: lead.bitableRecordId },
      data: { fields: fieldsAny },
    });
    return { recordId: lead.bitableRecordId, created: false };
  }

  const res = await feishuClient.bitable.v1.appTableRecord.create({
    path: { app_token: cfg.appToken, table_id: cfg.tableId },
    data: { fields: fieldsAny },
  });
  const recordId = res.data?.record?.record_id;
  if (!recordId) throw new Error("bitable create 返回无 record_id");
  return { recordId, created: true };
}

// ─────────────────────────────────────────────────────────────
// Pull: bitable → lead（仅同步 status / priority 回流）
// ─────────────────────────────────────────────────────────────

export interface BitableLeadUpdate {
  recordId: string;
  status?: string; // 已转换为内部枚举值
  priority?: string;
  lastModifiedAt: Date;
}

/**
 * 把 bitable 单值字段统一压平成字符串 — bitable 单选返回 string，
 * 但有些 SDK 版本会返回数组或对象。
 */
function flattenSelect(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0) {
    const first = v[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && "text" in first)
      return String((first as { text: unknown }).text ?? "");
  }
  if (v && typeof v === "object" && "text" in v) return String((v as { text: unknown }).text ?? "");
  return undefined;
}

/**
 * 拉取 bitable 中 modified_time > since 的记录，返回需要回写的字段。
 *
 * 实现：使用 records.search 接口（POST），通过 filter 条件过滤
 * `last_modified_time > since`。SDK 路径：bitable.v1.appTableRecord.search。
 */
export async function pullBitableUpdates(since: Date): Promise<BitableLeadUpdate[]> {
  const cfg = await getBitableConfig();
  if (!cfg) return [];

  const updates: BitableLeadUpdate[] = [];
  let pageToken: string | undefined;
  let safety = 10; // 最多翻 10 页（≈ 5000 行）保护 cron 不跑飞

  // bitable search 用 last_modified_time 过滤
  // 注意：bitable filter 不直接支持 modified_time > X，所以我们拉全量再过滤
  // 数据量小（< 1k）时性价比够；后期超大表才考虑增量 webhook
  do {
    // biome-ignore lint/suspicious/noExplicitAny: lark sdk search 返回的 data 类型在不同 SDK 版本不稳定
    const res: any = await feishuClient.bitable.v1.appTableRecord.search({
      path: { app_token: cfg.appToken, table_id: cfg.tableId },
      params: { page_size: 500, page_token: pageToken },
      data: cfg.viewIdSearch ? { view_id: cfg.viewIdSearch } : {},
    });
    const data = res.data as SearchResult;
    for (const r of data.items ?? []) {
      const lm = r.last_modified_time ? new Date(r.last_modified_time) : null;
      if (!lm || lm <= since) continue;

      const statusLabel = flattenSelect(r.fields.状态);
      const priorityLabel = flattenSelect(r.fields.优先级);
      const status = statusLabel ? STATUS_INVERSE[statusLabel] : undefined;
      const priority = priorityLabel ? PRIORITY_INVERSE[priorityLabel] : undefined;
      // 任意一个变了再回写；都没识别就跳过
      if (!status && !priority) continue;
      updates.push({ recordId: r.record_id, status, priority, lastModifiedAt: lm });
    }
    pageToken = data.has_more ? data.page_token : undefined;
    safety -= 1;
  } while (pageToken && safety > 0);

  return updates;
}
