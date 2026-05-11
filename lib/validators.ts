import { z } from "zod";
import {
  CASE_DEMO_KEYS,
  CASE_SLUG_MAX,
  CASE_SLUG_REGEX,
  CASE_LIMITS as L,
} from "@/lib/case-options";

/**
 * 公开提交线索表单的校验。
 * 与 db/schema.ts 中的 leads 表保持一致；honeypot 字段 `website` 必须为空。
 */
export const leadCreateSchema = z
  .object({
    name: z.string().trim().min(1, "请填写称呼").max(40, "姓名过长"),
    wechat: z.string().trim().max(60).optional(),
    phone: z.string().trim().max(20).optional(),
    email: z.string().trim().email("邮箱格式不正确").max(120).optional().or(z.literal("")),
    businessType: z.enum(["APPOINTMENT", "ORDER_INVENTORY", "WEBSITE_CRM", "CUSTOM"]),
    budgetRange: z.enum(["UNDER_3K", "R_3K_8K", "R_8K_20K", "OVER_20K", "UNSURE"]),
    timeline: z.enum(["WITHIN_2W", "WITHIN_1M", "WITHIN_3M", "UNSURE"]).optional(),
    painPoint: z.string().max(1000).optional(),
    message: z.string().min(5, "需求描述太短").max(2000, "需求描述过长"),
    source: z.string().max(500).optional(),
    // honeypot：机器人会填，真人看不到
    website: z.string().max(0).optional().or(z.literal("")),
  })
  .refine((d) => Boolean(d.wechat) || Boolean(d.phone) || Boolean(d.email), {
    message: "至少留一种联系方式（微信 / 手机 / 邮箱）",
    path: ["wechat"],
  });

export type LeadCreateInput = z.infer<typeof leadCreateSchema>;

/**
 * 后台变更线索状态。
 */
export const changeLeadStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["NEW", "CONTACTED", "QUALIFYING", "QUOTED", "WON", "LOST", "ARCHIVED"]),
});

export const changeLeadPrioritySchema = z.object({
  id: z.string().min(1),
  priority: z.enum(["LOW", "NORMAL", "HIGH"]),
});

export const addLeadNoteSchema = z.object({
  leadId: z.string().min(1),
  content: z.string().trim().min(1, "请填写跟进内容").max(2000),
  nextFollowUpAt: z.string().datetime().optional().or(z.literal("")),
});

/**
 * FAQ 编辑。
 */
export const faqUpsertSchema = z.object({
  id: z.string().optional(),
  question: z.string().trim().min(1).max(200),
  answer: z.string().trim().min(1).max(20_000),
  order: z.number().int().min(0).default(0),
  published: z.boolean().default(true),
});

/**
 * 站点设置批量更新。
 */
export const settingsUpdateSchema = z.record(z.string().min(1), z.string());

/**
 * 作品案例（v2 内容 CMS）
 */

export const caseMetricSchema = z.object({
  label: z.string().trim().min(1).max(L.metricLabel),
  value: z.string().trim().min(1).max(L.metricValue),
  note: z.string().trim().max(L.metricNote).optional().or(z.literal("")),
});

export const caseGalleryItemSchema = z.object({
  url: z.string().trim().url("图集 URL 不合法").max(L.galleryUrl),
  alt: z.string().trim().min(1, "图集需要 alt 描述").max(L.galleryAlt),
  caption: z.string().trim().max(L.galleryCaption).optional().or(z.literal("")),
});

export const clientQuoteSchema = z.object({
  text: z.string().trim().min(1).max(L.quoteText),
  authorName: z.string().trim().min(1).max(L.quoteAuthorName),
  authorTitle: z.string().trim().max(L.quoteAuthorTitle).optional().or(z.literal("")),
});

// TipTap doc 结构：宽松校验（顶层必须 type=doc，content 数组放任 TipTap 自决）
export const tipTapDocSchema = z
  .object({
    type: z.literal("doc"),
    content: z.array(z.unknown()).optional(),
  })
  .nullable();

/**
 * 创建 / 更新案例的统一 schema。
 * - 创建：必填 slug + title + summary
 * - 更新：所有字段可选，由 server 端 patch 合并
 */
export const caseUpsertSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, "slug 至少 2 字符")
    .max(CASE_SLUG_MAX, `slug 最多 ${CASE_SLUG_MAX} 字符`)
    .regex(CASE_SLUG_REGEX, "slug 仅支持小写英数和短横线"),
  title: z.string().trim().min(1, "请填写标题").max(L.title),
  subtitle: z.string().trim().max(L.subtitle).optional().or(z.literal("")),
  summary: z.string().trim().min(1, "请填写摘要").max(L.summary),
  outcomeSummary: z.string().trim().max(L.outcomeSummary).optional().or(z.literal("")),
  clientName: z.string().trim().max(L.clientName).optional().or(z.literal("")),
  industry: z.string().trim().max(L.industry).optional().or(z.literal("")),
  year: z.number().int().min(2000).max(2100).optional().nullable(),
  duration: z.string().trim().max(L.duration).optional().or(z.literal("")),
  coverImage: z.string().trim().url().max(L.coverImageUrl).optional().or(z.literal("")),
  body: tipTapDocSchema.optional(),
  clientQuote: clientQuoteSchema.nullable().optional(),
  demoComponent: z.enum(CASE_DEMO_KEYS).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(L.tag)).max(L.tags).default([]),
  techStack: z.array(z.string().trim().min(1).max(L.techItem)).max(L.techStack).default([]),
  metrics: z.array(caseMetricSchema).max(L.metrics).default([]),
  gallery: z.array(caseGalleryItemSchema).max(L.gallery).default([]),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
});

export type CaseUpsertInput = z.infer<typeof caseUpsertSchema>;
export type CaseMetricInput = z.infer<typeof caseMetricSchema>;
export type CaseGalleryItemInput = z.infer<typeof caseGalleryItemSchema>;
export type ClientQuoteInput = z.infer<typeof clientQuoteSchema>;
