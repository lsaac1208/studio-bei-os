import { describe, expect, test } from "vitest";
import { leadCreateSchema } from "@/lib/validators";

const base = {
  name: "张三",
  wechat: "wx_test",
  businessType: "APPOINTMENT" as const,
  budgetRange: "R_3K_8K" as const,
  message: "我想做一个预约系统。",
};

describe("leadCreateSchema", () => {
  test("最小可提交：name + wechat + 业务/预算/留言", () => {
    const r = leadCreateSchema.safeParse(base);
    expect(r.success).toBe(true);
  });

  test("name 必填，空字符串失败", () => {
    const r = leadCreateSchema.safeParse({ ...base, name: "" });
    expect(r.success).toBe(false);
  });

  test("message 太短失败（< 5 字）", () => {
    const r = leadCreateSchema.safeParse({ ...base, message: "嗯" });
    expect(r.success).toBe(false);
  });

  test("至少一种联系方式：缺微信、手机、邮箱 全空 → 失败", () => {
    const r = leadCreateSchema.safeParse({
      ...base,
      wechat: undefined,
      phone: undefined,
      email: undefined,
    });
    expect(r.success).toBe(false);
  });

  test("email 仅 phone 也接受", () => {
    const r = leadCreateSchema.safeParse({
      ...base,
      wechat: undefined,
      phone: "13800138000",
    });
    expect(r.success).toBe(true);
  });

  test("email 仅 email 也接受", () => {
    const r = leadCreateSchema.safeParse({
      ...base,
      wechat: undefined,
      email: "a@b.com",
    });
    expect(r.success).toBe(true);
  });

  test("非法 email 拒绝", () => {
    const r = leadCreateSchema.safeParse({ ...base, email: "not-an-email" });
    expect(r.success).toBe(false);
  });

  test("非法 businessType 拒绝", () => {
    const r = leadCreateSchema.safeParse({ ...base, businessType: "BOGUS" });
    expect(r.success).toBe(false);
  });

  test("空 email 字符串视为缺省（不触发 email 校验）", () => {
    const r = leadCreateSchema.safeParse({ ...base, email: "" });
    expect(r.success).toBe(true);
  });

  test("honeypot 字段不允许有内容", () => {
    const r = leadCreateSchema.safeParse({ ...base, website: "http://spam.example" });
    expect(r.success).toBe(false);
  });
});
