import { describe, expect, test } from "vitest";
import { genLeadCode } from "@/lib/lead-code";

describe("genLeadCode", () => {
  test("格式 SB-YYYY-XXXXXX（6 位大写后缀）", () => {
    const code = genLeadCode();
    const year = new Date().getFullYear();
    expect(code).toMatch(/^SB-\d{4}-[A-Z0-9]{6}$/);
    expect(code.startsWith(`SB-${year}-`)).toBe(true);
  });

  test("连续生成 100 条不撞", () => {
    const set = new Set<string>();
    for (let i = 0; i < 100; i++) set.add(genLeadCode());
    expect(set.size).toBe(100);
  });

  test("年份与系统时钟同步", () => {
    const code = genLeadCode();
    const year = Number(code.split("-")[1]);
    expect(year).toBe(new Date().getFullYear());
  });
});
