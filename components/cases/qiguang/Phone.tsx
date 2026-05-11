"use client";

import { type FormEvent, useState } from "react";
import { addDays } from "@/lib/case/format";
import { SERVICES, TIME_SLOTS } from "@/lib/case/qiguang";
import { cn } from "@/lib/utils";

export type PhoneSubmitData = {
  customer: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  note: string;
};

type Props = {
  onSubmit: (data: PhoneSubmitData) => void;
};

const initialForm = () => ({
  customer: "",
  phone: "",
  date: addDays(1),
  time: TIME_SLOTS[0],
  note: "",
});

export function Phone({ onSubmit }: Props) {
  const [selectedService, setSelectedService] = useState(SERVICES[0].name);
  const [form, setForm] = useState(initialForm);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.customer.trim() || !form.phone.trim()) return;
    onSubmit({ ...form, service: selectedService });
    setForm(initialForm());
  };

  return (
    <section aria-label="客户端 — 在线预约">
      {/* pane tag */}
      <div className="mb-4 flex items-center gap-2.5 text-[11px] text-mute uppercase tracking-[0.14em]">
        <span className="h-2 w-2 flex-none rounded-full bg-studio-1" />
        <strong className="font-bold text-ink tracking-[0.16em]">C 端</strong>
        <small className="font-normal normal-case text-mute tracking-normal">
          客户在小程序 / H5 看到的界面
        </small>
      </div>

      {/* phone frame */}
      <div className="sticky top-24 mx-auto w-full max-w-[380px] overflow-hidden rounded-[36px] border border-hairline bg-gradient-to-b from-[#fbf2eb] to-white shadow-[0_30px_60px_-20px_rgba(42,20,16,0.18),0_12px_24px_-8px_rgba(42,20,16,0.12)]">
        {/* status bar */}
        <div className="flex items-center justify-between px-6.5 pt-3.5 font-bold text-xs tabular-nums">
          <span>9:41</span>
          <span className="inline-flex gap-1">
            <i className="block h-1.5 w-3.5 rounded-sm bg-ink" />
            <i className="block h-1.5 w-3.5 rounded-sm bg-ink" />
            <i className="block h-1.5 w-5.5 rounded-sm bg-ink" />
          </span>
        </div>

        {/* hero */}
        <div className="px-6 pt-6.5 pb-3">
          <div className="font-bold text-[11px] text-studio-1 uppercase tracking-[0.14em]">
            栖光摄影 · 城市轻写真
          </div>
          <h4 className="mt-3.5 mb-2 font-serif font-bold text-[28px] text-studio-ink italic leading-[1.05] tracking-[-0.03em]">
            把日常拍成
            <br />
            可以裱起来的画面
          </h4>
          <p className="text-[12px] text-mute">主理人接单 / 限量出片 / 城市光影</p>
        </div>

        {/* service list */}
        <div className="grid gap-2 px-5 pt-4 pb-1">
          {SERVICES.map((s) => {
            const active = s.name === selectedService;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedService(s.name)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all",
                  active
                    ? "border-studio-1 bg-studio-2/50 shadow-[0_0_0_3px_rgba(229,96,79,0.12)]"
                    : "border-hairline bg-white hover:border-studio-1/40",
                )}
              >
                <span className="grid h-11 w-11 flex-none place-items-center rounded-[10px] bg-gradient-to-br from-studio-2 to-studio-1 font-bold text-lg text-white">
                  {s.mark}
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block font-bold text-[13px]">{s.name}</strong>
                  <small className="mt-0.5 block text-[11px] text-mute">
                    {s.duration} 分钟 · {s.desc}
                  </small>
                </span>
                <span className="font-mono font-bold text-[13px] text-studio-ink tabular-nums">
                  ¥{s.price}
                </span>
              </button>
            );
          })}
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="grid gap-2.5 px-5 py-3 pb-5">
          <div className="grid grid-cols-2 gap-2">
            <Field label="姓 / 称呼">
              <input
                value={form.customer}
                onChange={(e) => setForm((f) => ({ ...f, customer: e.target.value }))}
                placeholder="例如：林女士"
                required
                className={inputClass}
              />
            </Field>
            <Field label="手机号">
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="13800000000"
                required
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="服务项目">
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className={inputClass}
              required
            >
              {SERVICES.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} · ¥{s.price}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="日期">
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
                className={inputClass}
              />
            </Field>
            <Field label="时间段">
              <select
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                required
                className={inputClass}
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="备注（妆造 / 期望 / 出片风格）">
            <textarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              rows={2}
              placeholder="可以留空"
              className={cn(inputClass, "min-h-14 resize-y leading-snug")}
            />
          </Field>

          <button
            type="submit"
            className="mt-1.5 flex items-center justify-between rounded-xl bg-studio-ink px-4.5 py-3.5 font-bold text-[13px] text-white tracking-wide transition-all hover:-translate-y-px hover:bg-studio-1"
          >
            <span>提交预约</span>
            <span aria-hidden="true">→</span>
          </button>
        </form>
      </div>
    </section>
  );
}

const inputClass =
  "w-full rounded-[10px] border border-hairline bg-white px-3 py-2.5 text-[13px] text-ink outline-none transition-shadow focus:border-studio-1 focus:shadow-[0_0_0_3px_rgba(229,96,79,0.16)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: children 一定是 input/select/textarea，使用 implicit label association
    <label className="grid gap-1">
      <span className="font-bold text-[10px] text-mute uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}
