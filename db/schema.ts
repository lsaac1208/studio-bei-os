import { createId } from "@paralleldrive/cuid2";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────────────────────
// 枚举
// ─────────────────────────────────────────────────────────────
export const businessTypeEnum = pgEnum("business_type", [
  "APPOINTMENT", // 预约 / 排期
  "ORDER_INVENTORY", // 订单 / 库存
  "WEBSITE_CRM", // 官网 / 询盘
  "CUSTOM", // 定制系统
]);

export const budgetRangeEnum = pgEnum("budget_range", [
  "UNDER_3K",
  "R_3K_8K",
  "R_8K_20K",
  "OVER_20K",
  "UNSURE",
]);

export const timelineEnum = pgEnum("timeline", ["WITHIN_2W", "WITHIN_1M", "WITHIN_3M", "UNSURE"]);

export const leadStatusEnum = pgEnum("lead_status", [
  "NEW",
  "CONTACTED",
  "QUALIFYING",
  "QUOTED",
  "WON",
  "LOST",
  "ARCHIVED",
]);

export const priorityEnum = pgEnum("priority", ["LOW", "NORMAL", "HIGH"]);

// ─────────────────────────────────────────────────────────────
// Better Auth 标准表（含本项目扩展字段）
// ─────────────────────────────────────────────────────────────
export const user = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  name: text("name").notNull(),
  image: text("image"),

  // 扩展：应急密码登录
  passwordHash: text("password_hash"),

  // 扩展：飞书绑定
  larkOpenId: text("lark_open_id").unique(),
  larkUnionId: text("lark_union_id").unique(),
  larkTenantKey: text("lark_tenant_key"),

  // 扩展：角色（v1 仅 admin，预留 viewer 等）
  role: text("role").default("admin").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const account = pgTable("account", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const verification = pgTable("verification", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─────────────────────────────────────────────────────────────
// 业务表
// ─────────────────────────────────────────────────────────────
export const leads = pgTable(
  "leads",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    code: text("code").notNull().unique(), // 可读编号 SB-2026-0142
    name: text("name").notNull(),
    wechat: text("wechat"),
    phone: text("phone"),
    email: text("email"),
    businessType: businessTypeEnum("business_type").notNull(),
    budgetRange: budgetRangeEnum("budget_range").notNull(),
    timeline: timelineEnum("timeline"),
    painPoint: text("pain_point"),
    message: text("message").notNull(),
    source: text("source"), // referer / utm
    status: leadStatusEnum("status").default("NEW").notNull(),
    priority: priorityEnum("priority").default("NORMAL").notNull(),

    // 飞书卡片相关：原始消息 ID，供后续刷新卡片
    feishuMessageId: text("feishu_message_id"),

    // 飞书多维表格双向同步：
    //  - bitableRecordId：bitable 表内的 record id（push 成功后回填）
    //  - bitableSyncedAt：上次成功同步时间（push 或 pull 任一更新即写）
    bitableRecordId: text("bitable_record_id"),
    bitableSyncedAt: timestamp("bitable_synced_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("leads_status_created_idx").on(t.status, t.createdAt),
    // pull cron 增量查询：找还没同步过 / 同步时间老于阈值的 lead
    index("leads_bitable_synced_idx").on(t.bitableSyncedAt),
  ],
);

export const leadNotes = pgTable(
  "lead_notes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    leadId: text("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    nextFollowUpAt: timestamp("next_follow_up_at", { withTimezone: true }),
    // 待办：当 nextFollowUpAt 设置时该 note 即一条待办；
    // 标记完成后 completedAt 不为空，UI 划掉/隐藏
    completedAt: timestamp("completed_at", { withTimezone: true }),
    completedBy: text("completed_by"), // user.id
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("lead_notes_lead_created_idx").on(t.leadId, t.createdAt),
    // 待办列表查询：next_follow_up_at NOT NULL AND completed_at IS NULL
    index("lead_notes_pending_followup_idx").on(t.nextFollowUpAt, t.completedAt),
  ],
);

export const leadActivities = pgTable(
  "lead_activities",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    leadId: text("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // CREATE | STATUS_CHANGE | PRIORITY_CHANGE | NOTE_ADDED | FEISHU_CARD_ACTION ...
    content: text("content").notNull(),
    actor: text("actor"), // user_id / 'system' / 'feishu_card'
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("lead_activities_lead_created_idx").on(t.leadId, t.createdAt)],
);

export const faqs = pgTable(
  "faqs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    question: text("question").notNull(),
    answer: text("answer").notNull(), // TipTap HTML / Markdown 字符串
    order: integer("order").default(0).notNull(),
    published: boolean("published").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("faqs_published_order_idx").on(t.published, t.order)],
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────
// 作品案例（v2 内容 CMS）
// ─────────────────────────────────────────────────────────────

// JSONB 字段形状（仅类型层；DB 不强制）
export interface CaseMetric {
  label: string;
  value: string;
  note?: string;
}

export interface CaseGalleryItem {
  url: string;
  alt: string;
  caption?: string;
}

export interface ClientQuote {
  text: string;
  authorName: string;
  authorTitle?: string;
}

export type TipTapDoc = { type: "doc"; content?: unknown[] };

export const cases = pgTable(
  "cases",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    summary: text("summary").notNull(),
    outcomeSummary: text("outcome_summary"),
    clientName: text("client_name"),
    industry: text("industry"),
    year: integer("year"),
    duration: text("duration"),
    coverImage: text("cover_image"),
    body: jsonb("body").$type<TipTapDoc | null>().default(null),
    clientQuote: jsonb("client_quote").$type<ClientQuote | null>().default(null),
    demoComponent: text("demo_component"),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    techStack: jsonb("tech_stack").$type<string[]>().default([]).notNull(),
    metrics: jsonb("metrics").$type<CaseMetric[]>().default([]).notNull(),
    gallery: jsonb("gallery").$type<CaseGalleryItem[]>().default([]).notNull(),
    published: boolean("published").default(false).notNull(),
    featured: boolean("featured").default(false).notNull(),
    order: integer("order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("cases_published_order_idx").on(t.published, t.order),
    index("cases_featured_order_idx").on(t.featured, t.order),
  ],
);

// ─────────────────────────────────────────────────────────────
// 首页内容块（v2 Landing CMS）
// ─────────────────────────────────────────────────────────────
//
// 设计：单一 jsonb 表存所有"列表型"首页内容。
// 不同 kind 的 data 形状不同，由应用层（zod schema + 渲染组件）保障类型；
// DB 层不强制，便于后续新增 kind 而不动 schema。

export type LandingBlockKind = "service" | "pricing" | "process" | "fit_good" | "fit_not";

/** Services 卡片：4 类业务套餐 */
export interface LandingServiceData {
  num: string; // "01"
  title: string;
  desc: string;
  bullets: string[];
  tagline: string;
}

/** Pricing 档位：3 档报价 */
export interface LandingPricingData {
  label: string; // "起步版"
  price: string; // "¥3,000 — ¥8,000"
  desc: string;
  bullets: string[];
  featured: boolean;
}

/** Process 步骤：5 步合作流程 */
export interface LandingProcessData {
  num: string; // "01"
  title: string;
  desc: string;
}

/** Fit Good / Not Fit：单条短文 */
export interface LandingFitData {
  text: string;
}

export type LandingBlockData =
  | LandingServiceData
  | LandingPricingData
  | LandingProcessData
  | LandingFitData;

export const landingBlocks = pgTable(
  "landing_blocks",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    kind: text("kind").notNull(), // LandingBlockKind
    order: integer("order").default(0).notNull(),
    data: jsonb("data").$type<LandingBlockData>().notNull(),
    published: boolean("published").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("landing_blocks_kind_order_idx").on(t.kind, t.order)],
);

// ─────────────────────────────────────────────────────────────
// 类型导出
// ─────────────────────────────────────────────────────────────
export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type LeadNote = typeof leadNotes.$inferSelect;
export type NewLeadNote = typeof leadNotes.$inferInsert;
export type LeadActivity = typeof leadActivities.$inferSelect;
export type NewLeadActivity = typeof leadActivities.$inferInsert;
export type Faq = typeof faqs.$inferSelect;
export type NewFaq = typeof faqs.$inferInsert;
export type Setting = typeof settings.$inferSelect;

export type BusinessType = (typeof businessTypeEnum.enumValues)[number];
export type BudgetRange = (typeof budgetRangeEnum.enumValues)[number];
export type Timeline = (typeof timelineEnum.enumValues)[number];
export type LeadStatus = (typeof leadStatusEnum.enumValues)[number];
export type Priority = (typeof priorityEnum.enumValues)[number];

export type Case = typeof cases.$inferSelect;
export type NewCase = typeof cases.$inferInsert;

export type LandingBlock = typeof landingBlocks.$inferSelect;
export type NewLandingBlock = typeof landingBlocks.$inferInsert;
