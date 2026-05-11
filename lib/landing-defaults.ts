import type {
  LandingFitData,
  LandingPricingData,
  LandingProcessData,
  LandingServiceData,
} from "@/db/schema";

/**
 * 首页"列表型"区块的默认数据。
 *
 * 用途：
 *   1. 首次部署 / DB 空 → frontend 的 fallback；
 *   2. seed-landing 脚本初次注入 DB 内容；
 *   3. 后台空状态 → 「恢复默认」按钮的数据源。
 *
 * 编辑这里**不会**自动同步到 DB（DB 是 source of truth）。
 * 部署后内容由 /admin/landing 维护。
 */

export const DEFAULT_SERVICES: LandingServiceData[] = [
  {
    num: "01",
    title: "预约 / 排期系统",
    desc: "适合摄影、美容美甲、宠物店、培训、诊所等需要减少微信反复沟通的门店。",
    bullets: ["客户在线选择服务与时间", "商家后台确认、取消、完成", "每日排期、客户记录、状态提醒"],
    tagline: "从漏消息变成可管理排期",
  },
  {
    num: "02",
    title: "订单 / 库存系统",
    desc: "适合烘焙作坊、电商团队、批发商、小工厂，把 Excel 和便签变成在线看板。",
    bullets: ["下单自动扣减库存", "订单状态流转和发货跟进", "低库存预警与销售统计"],
    tagline: "从手工表格变成经营数据",
  },
  {
    num: "03",
    title: "官网 / 询盘 CRM",
    desc: "适合 B2B 工厂、外贸公司、装修咨询服务，让官网承担获客和销售跟进任务。",
    bullets: ["品牌官网与询盘表单", "预算、来源、需求自动收集", "线索分级与跟进看板"],
    tagline: "从展示官网变成获客入口",
  },
  {
    num: "04",
    title: "定制业务系统 / 自动化",
    desc: "适合已有明确流程痛点的团队，把重复录入、统计、提醒、导出做成工具。",
    bullets: ["CRM、工单、报价、报表", "飞书 / 企业微信 / 邮件通知", "Excel 导入导出与 API 对接"],
    tagline: "从重复人工变成自动化流程",
  },
];

export const DEFAULT_PRICING: LandingPricingData[] = [
  {
    label: "起步版",
    price: "¥3,000 — ¥8,000",
    desc: "适合先验证一个流程，例如预约表单、简单官网询盘、轻量订单记录。",
    bullets: ["1 个核心业务流程", "基础后台或数据列表", "移动端适配与上线指导"],
    featured: false,
  },
  {
    label: "标准版",
    price: "¥8,000 — ¥20,000",
    desc: "适合大多数中小商家，把前台入口和后台管理一起做成可用系统。",
    bullets: ["C 端页面 + B 端后台", "状态流转、统计、筛选", "部署上线与基础培训"],
    featured: true,
  },
  {
    label: "定制版",
    price: "¥20,000+",
    desc: "适合多角色、多流程、需要真实后端、权限、通知、报表、第三方集成的项目。",
    bullets: ["完整业务系统架构", "权限、API、通知、报表", "长期维护与迭代支持"],
    featured: false,
  },
];

export const DEFAULT_PROCESS: LandingProcessData[] = [
  {
    num: "01",
    title: "需求梳理",
    desc: "确认你现在怎么接单、记录、跟进、交付，找出最值得先线上化的流程。",
  },
  {
    num: "02",
    title: "原型确认",
    desc: "先画清楚页面结构、字段、状态和操作路径，避免直接开发后大改。",
  },
  {
    num: "03",
    title: "开发联调",
    desc: "完成前端、后端、数据结构、表单校验、状态流转和核心业务逻辑。",
  },
  {
    num: "04",
    title: "上线交付",
    desc: "部署到服务器或平台，配置域名、基础安全、备份方案和使用说明。",
  },
  {
    num: "05",
    title: "维护迭代",
    desc: "上线后根据真实使用情况优化字段、报表、通知和管理流程。",
  },
];

export const DEFAULT_FIT_GOOD: LandingFitData[] = [
  { text: "已经有稳定业务，但流程还靠微信、Excel、人工记录" },
  { text: "知道自己哪里混乱，只是不知道怎么做成系统" },
  { text: "愿意先做一个可用版本，再逐步迭代" },
  { text: "看重交付结果，而不是只买几张页面图" },
];

export const DEFAULT_FIT_NOT: LandingFitData[] = [
  { text: "只想用极低预算仿一个大型平台" },
  { text: "需求每天大变，但没有决策人确认" },
  { text: "只需要单纯切图，不关心业务流程" },
  { text: "完全没有预算和上线时间预期" },
];
