/**
 * 作品案例的常量与配置：
 * - DEMO 组件注册表 key（前端按 key 渲染对应 React 组件）
 * - slug 校验正则
 * - 字段长度上限
 *
 * 所有 server / client 都可用（无副作用）。
 */

export const CASE_DEMO_KEYS = ["qiguang", "mailab", "hengyue"] as const;
export type CaseDemoKey = (typeof CASE_DEMO_KEYS)[number];

export const CASE_DEMO_LABELS: Record<CaseDemoKey, string> = {
  qiguang: "栖光摄影 · 预约系统演示",
  mailab: "麦研所烘焙 · 订单看板演示",
  hengyue: "恒越精密 · 销售线索板演示",
};

export function isCaseDemoKey(value: unknown): value is CaseDemoKey {
  return typeof value === "string" && (CASE_DEMO_KEYS as readonly string[]).includes(value);
}

/**
 * URL slug 规则：仅小写英数和短横线，长度 2-64。
 * 例：'qiguang-studio' / 'maiyan-bakery'
 */
export const CASE_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const CASE_SLUG_MAX = 64;

// 字段长度上限（与 zod schema 共用）
export const CASE_LIMITS = {
  title: 200,
  subtitle: 300,
  summary: 400,
  outcomeSummary: 200,
  clientName: 120,
  industry: 80,
  duration: 40,
  coverImageUrl: 1000,
  tag: 40,
  tags: 12,
  techItem: 60,
  techStack: 16,
  metricLabel: 60,
  metricValue: 40,
  metricNote: 60,
  metrics: 8,
  galleryAlt: 200,
  galleryCaption: 300,
  galleryUrl: 1000,
  gallery: 24,
  quoteText: 600,
  quoteAuthorName: 120,
  quoteAuthorTitle: 120,
} as const;
