"use client";

import { type FormEvent, useState } from "react";
import { type Product, stockStatus } from "@/lib/case/mailab";
import { cn } from "@/lib/utils";

export type OrderSubmit = {
  customer: string;
  productId: string;
  quantity: number;
};

type Props = {
  products: Product[];
  onSubmit: (data: OrderSubmit) => void;
};

const stockPillCls: Record<"ok" | "low" | "out", string> = {
  ok: "bg-ok-bg text-ok",
  low: "bg-warn-bg text-warn",
  out: "bg-bad-bg text-bad",
};

const initialForm = (firstAvailable: string) => ({
  customer: "",
  productId: firstAvailable,
  quantity: 1,
});

export function Storefront({ products, onSubmit }: Props) {
  const firstAvailable = products.find((p) => p.stock > 0)?.id ?? products[0].id;
  const [form, setForm] = useState(initialForm(firstAvailable));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.customer.trim() || form.quantity < 1) return;
    onSubmit({ ...form, customer: form.customer.trim() });
    setForm(initialForm(firstAvailable));
  };

  return (
    <section aria-label="客户端 — 商品下单">
      {/* pane tag */}
      <div className="mb-4 flex items-center gap-2.5 text-[11px] text-mute uppercase tracking-[0.14em]">
        <span className="h-2 w-2 flex-none rounded-full bg-bakery-1" />
        <strong className="font-bold text-ink tracking-[0.16em]">C 端</strong>
        <small className="font-normal normal-case text-mute tracking-normal">
          客户在公众号 / 小程序看到的下单页
        </small>
      </div>

      <div className="sticky top-24 mx-auto w-full max-w-[380px] overflow-hidden rounded-[18px] border border-hairline bg-gradient-to-b from-[#fbf5e2] to-white">
        {/* hero */}
        <div className="border-hairline border-b px-6 py-6.5">
          <small className="font-bold text-[11px] text-bakery-1 uppercase tracking-[0.14em]">
            本周供应 · 限量手作
          </small>
          <h4 className="mt-3.5 font-bold text-[26px] text-bakery-ink leading-[1.1] tracking-[-0.03em]">
            把客户的下单
            <em className="font-serif font-semibold text-bakery-1 italic">一次写进</em>
            你的库存表
          </h4>
        </div>

        {/* product grid */}
        <div className="grid grid-cols-2 gap-2.5 p-4.5">
          {products.map((p) => {
            const status = stockStatus(p);
            const statusText =
              status === "out" ? "缺货" : status === "low" ? `仅剩 ${p.stock}` : `库存 ${p.stock}`;
            return (
              <div
                key={p.id}
                className="flex flex-col overflow-hidden rounded-xl border border-hairline bg-white"
              >
                <div className="grid h-[90px] place-items-center bg-gradient-to-br from-bakery-2 to-bakery-1 font-bold text-3xl text-white/95">
                  {p.mark}
                </div>
                <div className="grid gap-1 px-3 py-3">
                  <strong className="font-bold text-[13px] tracking-tight">{p.name}</strong>
                  <span className="font-mono text-[10px] text-mute tracking-wide">{p.sku}</span>
                  <span className="mt-0.5 font-mono font-bold text-[14px] text-bakery-ink tabular-nums">
                    ¥{p.price}
                  </span>
                  <span
                    className={cn(
                      "inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 font-semibold text-[10px] tracking-wide",
                      stockPillCls[status],
                    )}
                  >
                    <span className="h-1 w-1 rounded-full bg-current" />
                    {statusText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* order form */}
        <form onSubmit={handleSubmit} className="grid gap-2.5 border-hairline border-t px-5 py-4.5">
          <div className="grid grid-cols-[1fr_1fr_70px] gap-2">
            <Field label="客户 / 渠道">
              <input
                value={form.customer}
                onChange={(e) => setForm((f) => ({ ...f, customer: e.target.value }))}
                placeholder="例如：小红书 · 林"
                required
                className={inputClass}
              />
            </Field>
            <Field label="商品">
              <select
                value={form.productId}
                onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
                required
                className={inputClass}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                    {p.name} · 库存 {p.stock}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="数量">
              <input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, quantity: Math.max(1, Number(e.target.value) || 1) }))
                }
                required
                className={inputClass}
              />
            </Field>
          </div>

          <button
            type="submit"
            className="mt-1 flex items-center justify-between rounded-xl bg-bakery-ink px-4.5 py-3 font-bold text-[13px] text-white transition-all hover:-translate-y-px hover:bg-bakery-1"
          >
            <span>下单 · 自动扣库存</span>
            <span aria-hidden="true">→</span>
          </button>
        </form>
      </div>
    </section>
  );
}

const inputClass =
  "w-full rounded-[10px] border border-hairline bg-white px-3 py-2.5 text-[13px] text-ink outline-none transition-shadow focus:border-bakery-1 focus:shadow-[0_0_0_3px_rgba(182,119,47,0.16)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: children 一定是 input/select，使用 implicit label association
    <label className="grid gap-1">
      <span className="font-bold text-[10px] text-mute uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}
