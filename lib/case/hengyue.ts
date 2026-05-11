/**
 * 案例 03 恒越精密 — 数据模型 + 自动评级 + 默认 seed
 * 询盘表单根据预算 / 月需求量自动判定意向等级。
 */

export type LeadLevel = "hot" | "medium";
export type LeadStage = "new" | "following" | "closed";

export type Lead = {
  id: string;
  name: string;
  company: string;
  contact: string;
  budget: string;
  volume: string;
  source: string;
  message: string;
  level: LeadLevel;
  stage: LeadStage;
  createdAt: string;
};

export const BUDGET_OPTIONS = ["3-8万", "8-20万", "20-50万", "50万+"] as const;
export const VOLUME_OPTIONS = [
  "样件 / 试制",
  "100-1000 件",
  "1000-10000 件",
  "10000 件以上",
] as const;
export const SOURCE_OPTIONS = ["百度搜索", "Google / 外贸", "老客户介绍", "行业展会"] as const;

export const computeLevel = (budget: string, volume: string): LeadLevel => {
  const isHotBudget = budget === "20-50万" || budget === "50万+";
  const isHotVolume = volume === "1000-10000 件" || volume === "10000 件以上";
  return isHotBudget && isHotVolume ? "hot" : "medium";
};

export const createDefaultLeads = (): Lead[] => [
  {
    id: "L1001",
    name: "李工",
    company: "盛恒新能源 · 电池结构件",
    contact: "微信 li-2026",
    budget: "20-50万",
    volume: "1000-10000 件",
    message: "需要 6 系铝 CNC 加工，公差 ±0.01mm，希望先做样件评估。",
    level: "hot",
    stage: "following",
    source: "Google / 外贸",
    createdAt: new Date().toISOString(),
  },
  {
    id: "L1002",
    name: "Helen Chen",
    company: "MedTech 上海办公室",
    contact: "helen@medtech.demo",
    budget: "8-20万",
    volume: "100-1000 件",
    message: "医疗连接器内部金属件批量加工，要求 ISO 13485 资质。",
    level: "medium",
    stage: "new",
    source: "Google / 外贸",
    createdAt: new Date().toISOString(),
  },
  {
    id: "L1003",
    name: "赵经理",
    company: "瑞磁半导体设备厂",
    contact: "139****9901",
    budget: "50万+",
    volume: "10000 件以上",
    message: "希望对接长期合作工厂，优先考虑稳定的精度与交期。",
    level: "hot",
    stage: "new",
    source: "行业展会",
    createdAt: new Date().toISOString(),
  },
  {
    id: "L1004",
    name: "周老板",
    company: "杭州模具厂",
    contact: "微信 zhou-mould",
    budget: "3-8万",
    volume: "样件 / 试制",
    message: "几款样件试做，验证我们图纸的可加工性。",
    level: "medium",
    stage: "following",
    source: "百度搜索",
    createdAt: new Date().toISOString(),
  },
];
