import { createId } from "@paralleldrive/cuid2";

/**
 * 生成可读线索编号：SB-2026-A1B2C3
 * 6 位 cuid 后缀（大写），冲突概率在我们这量级可忽略。
 *
 * 抽到独立模块（不依赖 db / feishu / server-only），
 * 方便在 vitest node 环境直接 import 跑单元测试。
 */
export function genLeadCode(): string {
  const year = new Date().getFullYear();
  const suffix = createId().slice(-6).toUpperCase();
  return `SB-${year}-${suffix}`;
}
