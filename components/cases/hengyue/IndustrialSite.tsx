"use client";

import { type FormEvent, useState } from "react";
import { BUDGET_OPTIONS, SOURCE_OPTIONS, VOLUME_OPTIONS } from "@/lib/case/hengyue";

export type InquirySubmit = {
  name: string;
  company: string;
  contact: string;
  budget: string;
  volume: string;
  source: string;
  message: string;
};

type Props = {
  onSubmit: (data: InquirySubmit) => void;
};

const initialForm = (): InquirySubmit => ({
  name: "",
  company: "",
  contact: "",
  budget: BUDGET_OPTIONS[1],
  volume: VOLUME_OPTIONS[1],
  source: SOURCE_OPTIONS[0],
  message: "",
});

export function IndustrialSite({ onSubmit }: Props) {
  const [form, setForm] = useState<InquirySubmit>(initialForm);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.company.trim() || !form.contact.trim() || !form.message.trim()) {
      return;
    }
    onSubmit({
      ...form,
      name: form.name.trim(),
      company: form.company.trim(),
      contact: form.contact.trim(),
      message: form.message.trim(),
    });
    setForm(initialForm());
  };

  return (
    <section aria-label="客户端 — 工厂官网">
      <div className="mb-4 flex items-center gap-2.5 text-[11px] text-mute uppercase tracking-[0.14em]">
        <span className="h-2 w-2 flex-none rounded-full bg-indus-2" />
        <strong className="font-bold text-ink tracking-[0.16em]">C 端</strong>
        <small className="font-normal normal-case text-mute tracking-normal">
          客户访问的工厂官网
        </small>
      </div>

      <div className="sticky top-24 overflow-hidden rounded-[18px] bg-indus-bg text-indus-paper shadow-[0_30px_60px_-20px_rgba(15,27,60,0.4)]">
        {/* nav */}
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-3.5 text-[11px]">
          <span className="font-bold text-[12px] tracking-[0.1em]">HENGYUE / 恒越精密</span>
          <span className="text-[11px] text-white/50 tracking-wide">
            关于我们 · 产品 · 工艺 · 案例 · 联系
          </span>
        </div>

        {/* hero */}
        <div className="relative overflow-hidden px-7 pt-10 pb-9">
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: [
                "radial-gradient(circle at 90% -10%, rgba(241,90,36,0.28), transparent 40%)",
                "repeating-linear-gradient(135deg, transparent 0 11px, rgba(255,255,255,0.025) 11px 12px)",
              ].join(","),
            }}
          />
          <div className="relative">
            <span className="font-mono font-bold text-[11px] text-indus-2 tracking-[0.18em]">
              PRECISION CNC · SINCE 2009
            </span>
            <h3 className="mt-4.5 mb-7 font-bold text-[clamp(22px,3vw,32px)] leading-[1.2] tracking-[-0.02em]">
              为
              <em className="font-serif font-semibold text-indus-2 italic">
                新能源 · 医疗 · 半导体
              </em>
              <br />
              提供 ±0.005mm 级精密零件加工
            </h3>
            <div className="grid grid-cols-3 gap-6 border-t border-white/10 pt-6">
              {[
                { num: "17", unit: "年", label: "批量加工经验" },
                { num: "±0.005", unit: "mm", label: "稳定加工精度" },
                { num: "32", unit: "家", label: "长期合作客户" },
              ].map((s) => (
                <div key={s.label} className="grid gap-1">
                  <strong className="font-mono font-bold text-[26px] tabular-nums tracking-[-0.03em]">
                    {s.num}
                    <i className="ml-1 font-normal text-[12px] text-white/55 not-italic">
                      {s.unit}
                    </i>
                  </strong>
                  <small className="text-[11px] text-white/50 tracking-wide">{s.label}</small>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* form */}
        <form
          onSubmit={handleSubmit}
          className="grid gap-3.5 border-white/8 border-t bg-white/[0.03] px-7 py-6"
        >
          <div className="flex items-baseline justify-between">
            <strong className="text-[13px] tracking-wide">提交询盘</strong>
            <small className="text-[11px] text-indus-2">工程师 1 个工作日内回复</small>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="姓名">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="例如：李工"
                required
                className={inputClass}
              />
            </Field>
            <Field label="公司">
              <input
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                placeholder="贵司公司名"
                required
                className={inputClass}
              />
            </Field>
            <Field label="电话 / 微信">
              <input
                value={form.contact}
                onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                placeholder="便于工程师联系"
                required
                className={inputClass}
              />
            </Field>
            <Field label="预算范围">
              <select
                value={form.budget}
                onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                required
                className={inputClass}
              >
                {BUDGET_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="月需求量">
              <select
                value={form.volume}
                onChange={(e) => setForm((f) => ({ ...f, volume: e.target.value }))}
                required
                className={inputClass}
              >
                {VOLUME_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="来源">
              <select
                value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                required
                className={inputClass}
              >
                {SOURCE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="需求描述">
            <textarea
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              rows={3}
              placeholder="材质、图纸、交期、所在城市等"
              required
              className={`${inputClass} min-h-15 resize-y leading-snug`}
            />
          </Field>

          <button
            type="submit"
            className="mt-1.5 flex items-center justify-between rounded-xl bg-indus-2 px-4.5 py-3.5 font-bold text-[13px] text-white transition-all hover:-translate-y-px hover:bg-[#d44a16]"
          >
            <span>提交询盘</span>
            <span aria-hidden="true">→</span>
          </button>
        </form>
      </div>
    </section>
  );
}

const inputClass =
  "w-full rounded-[10px] border border-white/16 bg-white/[0.04] px-3 py-2.5 text-[13px] text-indus-paper outline-none transition-all placeholder:text-white/30 focus:border-indus-2 focus:shadow-[0_0_0_3px_rgba(241,90,36,0.18)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: children 一定是 input/select/textarea，使用 implicit label association
    <label className="grid gap-1">
      <span className="font-semibold text-[10px] text-white/50 uppercase tracking-wider">
        {label}
      </span>
      {children}
    </label>
  );
}
