"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatMoneyShort, uid } from "@/lib/case/format";
import {
  createDefaultOrders,
  type Order,
  type OrderStatus,
  PRODUCTS_SEED,
  type Product,
  SPARK_SEED,
} from "@/lib/case/mailab";
import { OrderKanban } from "./OrderKanban";
import { StockBlock } from "./StockBlock";
import { type OrderSubmit, Storefront } from "./Storefront";
import { TrendCard } from "./TrendCard";

const STORAGE_KEY = "studio-bei-mailab-v1";

type State = {
  products: Product[];
  orders: Order[];
};

const createInitial = (): State => ({
  products: PRODUCTS_SEED.map((p) => ({ ...p })),
  orders: createDefaultOrders(),
});

export function CaseMailab() {
  const [state, setState] = useState<State>(createInitial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setState(JSON.parse(stored));
    } catch {
      // 忽略损坏数据
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // 忽略 quota
    }
  }, [state, hydrated]);

  const addOrder = (data: OrderSubmit) => {
    const product = state.products.find((p) => p.id === data.productId);
    if (!product) return;
    if (data.quantity > product.stock) {
      toast(`库存不足 · ${product.name} 仅剩 ${product.stock} 件`);
      return;
    }

    setState((prev) => {
      const products = prev.products.map((p) =>
        p.id === product.id ? { ...p, stock: p.stock - data.quantity } : p,
      );
      const order: Order = {
        id: uid("SO"),
        customer: data.customer,
        productId: product.id,
        productName: product.name,
        productMark: product.mark,
        quantity: data.quantity,
        amount: product.price * data.quantity,
        status: "paid",
        createdAt: new Date().toISOString(),
      };
      return { products, orders: [order, ...prev.orders] };
    });
    toast(`订单已生成 · 库存 -${data.quantity}`);
  };

  const setOrderStatus = (id: string, status: OrderStatus) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    }));
    toast("订单状态已更新");
  };

  const removeOrder = (id: string) => {
    setState((prev) => ({ ...prev, orders: prev.orders.filter((o) => o.id !== id) }));
    toast("订单已删除");
  };

  const restock = (id: string) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === id
          ? {
              ...p,
              stock: p.stock + 10,
              maxStock: Math.max(p.maxStock, p.stock + 10),
            }
          : p,
      ),
    }));
    const product = state.products.find((p) => p.id === id);
    if (product) toast(`${product.name} 已补货 +10`);
  };

  // 派生统计
  const { revenue, pending, lowStock, series } = useMemo(() => {
    const todayRevenue = state.orders.reduce((sum, o) => sum + o.amount, 0);
    return {
      revenue: todayRevenue,
      pending: state.orders.filter((o) => o.status === "paid").length,
      lowStock: state.products.filter((p) => p.stock <= p.safeStock).length,
      series: [...SPARK_SEED, todayRevenue],
    };
  }, [state]);

  return (
    <article
      id="case-02"
      data-case="02"
      className="relative overflow-hidden border-hairline border-t bg-bakery-bg px-5 py-16 sm:px-8 lg:px-14 lg:py-28"
    >
      <span className="absolute top-6 right-5 font-mono text-[11px] text-mute uppercase tracking-[0.16em] sm:right-8 lg:right-14">
        Case 02
      </span>

      <header className="mx-auto mb-14 grid max-w-[1280px] items-end gap-10 lg:grid-cols-[2fr_1fr] lg:gap-14">
        <div>
          <div className="mb-5.5 flex flex-wrap items-center gap-3.5">
            <span className="font-mono text-[11px] text-mute uppercase tracking-[0.16em]">
              Case / 02
            </span>
            <span className="rounded-full border border-hairline-strong px-3 py-1 font-semibold text-[11px] text-ink uppercase tracking-[0.14em]">
              作坊电商 · 订单 · 库存
            </span>
          </div>
          <h2 className="mb-5.5 font-bold text-[clamp(40px,6vw,80px)] text-ink leading-none tracking-[-0.04em]">
            麦研所烘焙
            <small className="mt-3 block font-serif font-normal text-sm text-mute italic tracking-wider">
              Mai Lab Bakery
            </small>
          </h2>
          <p className="mb-5.5 max-w-[640px] text-[16px] text-ink-soft leading-[1.75]">
            主理人 + 两位伙伴的小型烘焙作坊，原来订单写在 Excel，库存写在墙上的便签。 我做了一套
            <strong className="rounded-sm bg-white/65 px-1 font-bold text-ink">
              商品下单页 + 订单流转看板 + 库存预警
            </strong>
            的轻量后台。
          </p>
          <ul className="grid gap-2 text-[14px] leading-snug">
            {[
              "下单时自动扣减原料 / 成品库存，低于安全库存高亮提示",
              "订单看板：待发货 → 已发货 → 已完成，状态一目了然",
              "看板顶部展示销售额、订单数、近 7 日趋势 sparkline",
            ].map((b) => (
              <li
                key={b}
                className="flex items-start gap-3.5 text-ink-soft before:mt-2.5 before:h-px before:w-4.5 before:flex-none before:bg-ink before:content-['']"
              >
                {b}
              </li>
            ))}
          </ul>
        </div>

        <aside className="grid gap-3 self-end">
          <StatCard
            label="当日销售"
            value={formatMoneyShort(revenue)}
            meta={`${state.orders.length} 笔订单 · 自动汇总`}
          />
          <StatCard label="待发货" value={pending} meta="老板可以一眼看到要发什么" />
          <StatCard label="需补货" value={lowStock} meta="低于安全库存自动飘红" />
        </aside>
      </header>

      <div className="mx-auto grid max-w-[1280px] items-start gap-8 lg:grid-cols-[380px_1fr]">
        <Storefront products={state.products} onSubmit={addOrder} />

        <div className="grid gap-4">
          <TrendCard series={series} />
          <OrderKanban
            orders={state.orders}
            onShip={(id) => setOrderStatus(id, "shipped")}
            onComplete={(id) => setOrderStatus(id, "completed")}
            onDelete={removeOrder}
          />
          <StockBlock products={state.products} onRestock={restock} />
        </div>
      </div>

      {/* footer link */}
      <div className="mx-auto mt-10 max-w-[1280px] text-right">
        <Link
          href="/cases/maiyan-bakery"
          className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-white/60 px-4 py-2 text-[13px] text-ink transition hover:border-hairline-strong hover:bg-white/90"
        >
          查看完整案例 <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

function StatCard({ label, value, meta }: { label: string; value: number | string; meta: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-white/50 px-5 py-4.5 backdrop-blur-sm">
      <small className="block font-semibold text-[10px] text-mute uppercase tracking-[0.14em]">
        {label}
      </small>
      <strong className="mt-2 block font-bold text-4xl tabular-nums tracking-[-0.04em]">
        {value}
      </strong>
      <span className="mt-1.5 block text-[12px] text-mute">{meta}</span>
    </div>
  );
}
