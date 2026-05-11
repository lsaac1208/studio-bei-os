import "server-only";

import { desc, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { cases, faqs, type LandingBlockKind, landingBlocks, leads } from "@/db/schema";

/**
 * 后台全文搜索（跨表 ILIKE，按表分组返回）。
 *
 * 数据量评估：
 *  - leads / cases / faqs / landing_blocks 单表行数都在 1k 以下（中长期）
 *  - ILIKE %q% 对小表足够快，不需要 to_tsvector 索引
 *  - 各表内按相关性 / 时间倒序，每表最多 RESULTS_PER_TABLE 条
 *
 * 安全：
 *  - q 走 drizzle parameterized SQL，不存在注入
 *  - 强制 q.length >= 1，截断到 80 字符（避免无意义大字符串扫表）
 */

export const RESULTS_PER_TABLE = 10;

export interface LeadSearchHit {
  kind: "lead";
  id: string;
  code: string;
  name: string;
  message: string;
  status: string;
  priority: string;
  createdAt: Date;
  contactSummary: string; // wechat / phone / email 命中预览
}

export interface CaseSearchHit {
  kind: "case";
  id: string;
  slug: string;
  title: string;
  industry: string | null;
  summary: string;
  published: boolean;
}

export interface FaqSearchHit {
  kind: "faq";
  id: string;
  question: string;
  answer: string; // 已截断
  published: boolean;
}

export interface LandingSearchHit {
  kind: "landing";
  id: string;
  blockKind: LandingBlockKind;
  preview: string; // 拼接 jsonb 里能搜到的字段
  published: boolean;
}

export type SearchHit = LeadSearchHit | CaseSearchHit | FaqSearchHit | LandingSearchHit;

export interface SearchResults {
  q: string;
  total: number;
  leads: LeadSearchHit[];
  cases: CaseSearchHit[];
  faqs: FaqSearchHit[];
  landing: LandingSearchHit[];
}

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const truncate = (s: string, n = 160) => (s.length <= n ? s : `${s.slice(0, n - 1)}…`);

const buildContactSummary = (lead: {
  wechat: string | null;
  phone: string | null;
  email: string | null;
}) =>
  [
    lead.wechat ? `微信:${lead.wechat}` : null,
    lead.phone ? `电话:${lead.phone}` : null,
    lead.email ? `邮箱:${lead.email}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

export async function searchAll(rawQ: string): Promise<SearchResults> {
  const q = rawQ.trim().slice(0, 80);
  if (!q) {
    return { q: "", total: 0, leads: [], cases: [], faqs: [], landing: [] };
  }
  const like = `%${q}%`;

  const [leadRows, caseRows, faqRows, landingRows] = await Promise.all([
    // ── Leads：name / code / wechat / phone / email / message / painPoint / source
    db
      .select({
        id: leads.id,
        code: leads.code,
        name: leads.name,
        wechat: leads.wechat,
        phone: leads.phone,
        email: leads.email,
        message: leads.message,
        status: leads.status,
        priority: leads.priority,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .where(
        or(
          ilike(leads.name, like),
          ilike(leads.code, like),
          ilike(leads.wechat, like),
          ilike(leads.phone, like),
          ilike(leads.email, like),
          ilike(leads.message, like),
          ilike(leads.painPoint, like),
          ilike(leads.source, like),
        ),
      )
      .orderBy(desc(leads.createdAt))
      .limit(RESULTS_PER_TABLE),

    // ── Cases：title / subtitle / summary / industry / clientName / outcomeSummary / slug
    db
      .select({
        id: cases.id,
        slug: cases.slug,
        title: cases.title,
        industry: cases.industry,
        summary: cases.summary,
        published: cases.published,
      })
      .from(cases)
      .where(
        or(
          ilike(cases.title, like),
          ilike(cases.subtitle, like),
          ilike(cases.summary, like),
          ilike(cases.industry, like),
          ilike(cases.clientName, like),
          ilike(cases.outcomeSummary, like),
          ilike(cases.slug, like),
        ),
      )
      .orderBy(desc(cases.updatedAt))
      .limit(RESULTS_PER_TABLE),

    // ── FAQs：question / answer
    db
      .select({
        id: faqs.id,
        question: faqs.question,
        answer: faqs.answer,
        published: faqs.published,
      })
      .from(faqs)
      .where(or(ilike(faqs.question, like), ilike(faqs.answer, like)))
      .orderBy(desc(faqs.updatedAt))
      .limit(RESULTS_PER_TABLE),

    // ── Landing blocks：jsonb data 转文本 ILIKE
    //   data::text 简单粗暴但有效（小表，行数 < 50）
    db
      .select({
        id: landingBlocks.id,
        kind: landingBlocks.kind,
        data: landingBlocks.data,
        published: landingBlocks.published,
      })
      .from(landingBlocks)
      .where(sql`${landingBlocks.data}::text ILIKE ${like}`)
      .orderBy(desc(landingBlocks.updatedAt))
      .limit(RESULTS_PER_TABLE),
  ]);

  const leadsHits: LeadSearchHit[] = leadRows.map((r) => ({
    kind: "lead",
    id: r.id,
    code: r.code,
    name: r.name,
    message: truncate(r.message),
    status: r.status,
    priority: r.priority,
    createdAt: r.createdAt,
    contactSummary: buildContactSummary(r),
  }));

  const casesHits: CaseSearchHit[] = caseRows.map((r) => ({
    kind: "case",
    id: r.id,
    slug: r.slug,
    title: r.title,
    industry: r.industry,
    summary: truncate(r.summary),
    published: r.published,
  }));

  const faqsHits: FaqSearchHit[] = faqRows.map((r) => ({
    kind: "faq",
    id: r.id,
    question: r.question,
    answer: truncate(stripHtml(r.answer)),
    published: r.published,
  }));

  const landingHits: LandingSearchHit[] = landingRows.map((r) => {
    // 把 data 里的字符串字段拼起来给个预览
    const data = r.data as unknown as Record<string, unknown>;
    const parts: string[] = [];
    for (const v of Object.values(data)) {
      if (typeof v === "string") parts.push(v);
      else if (Array.isArray(v)) parts.push(v.filter((x) => typeof x === "string").join(" / "));
    }
    return {
      kind: "landing",
      id: r.id,
      blockKind: r.kind as LandingBlockKind,
      preview: truncate(parts.join(" · ")),
      published: r.published,
    };
  });

  return {
    q,
    total: leadsHits.length + casesHits.length + faqsHits.length + landingHits.length,
    leads: leadsHits,
    cases: casesHits,
    faqs: faqsHits,
    landing: landingHits,
  };
}
