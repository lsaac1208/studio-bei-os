/**
 * lib/queries/leads.ts —— barrel（聚合导出）。
 *
 * 历史上这是一个 385 行的文件，里面有列表 / 导出 / 看板 / 详情 / 时间线 / 待办 / 周报统计
 * 7 块职能。R11 拆成 5 个聚焦文件，这里保留 barrel 让既有
 * `import { ... } from "@/lib/queries/leads"` 无需改动。
 *
 * 文件分布：
 *   leads-list.ts    列表 + 导出
 *   leads-kanban.ts  看板
 *   leads-detail.ts  单条 + 时间线
 *   leads-todos.ts   待办 + 徽章计数
 *   leads-stats.ts   周报统计
 */

export * from "./leads-detail";
export * from "./leads-kanban";
export * from "./leads-list";
export * from "./leads-stats";
export * from "./leads-todos";
