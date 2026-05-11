"use client";

import { MiniButton } from "@/components/cases/primitives";
import { formatMoney } from "@/lib/case/format";
import type { Order, OrderStatus } from "@/lib/case/mailab";

type Props = {
  orders: Order[];
  onShip: (id: string) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
};

const COLUMNS: Array<{ key: OrderStatus; label: string; desc: string }> = [
  { key: "paid", label: "待发货", desc: "刚下单 / 等待打包" },
  { key: "shipped", label: "运送中", desc: "顺丰 / 同城配送" },
  { key: "completed", label: "已完成", desc: "客户已签收 / 可复购" },
];

export function OrderKanban({ orders, onShip, onComplete, onDelete }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {COLUMNS.map((col) => {
        const items = orders.filter((o) => o.status === col.key);
        return (
          <div
            key={col.key}
            className="min-h-[140px] rounded-2xl border border-hairline bg-white/70 p-3.5"
          >
            <div className="mb-3.5 flex items-baseline justify-between border-hairline border-b border-dashed pb-2.5">
              <strong className="font-bold text-[13px]">{col.label}</strong>
              <small className="font-mono text-[11px] text-mute">
                {items.length} · {col.desc}
              </small>
            </div>

            {items.length === 0 ? (
              <div className="rounded-xl border border-hairline-strong border-dashed p-4 text-center text-[12px] text-mute">
                空闲 · 无订单
              </div>
            ) : (
              <div className="grid gap-2">
                {items.map((o) => (
                  <div
                    key={o.id}
                    className="rounded-xl border border-hairline bg-white p-3 transition-all hover:-translate-y-px hover:border-bakery-1"
                  >
                    <span className="font-mono text-[10px] text-mute tracking-wide">{o.id}</span>
                    <strong className="mt-1 block font-bold text-[13px]">{o.customer}</strong>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-mute">
                      <span>
                        {o.productName} × {o.quantity}
                      </span>
                      <span className="font-mono font-bold text-bakery-ink tabular-nums">
                        {formatMoney(o.amount)}
                      </span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {col.key === "paid" && (
                        <MiniButton variant="primary" onClick={() => onShip(o.id)}>
                          发货
                        </MiniButton>
                      )}
                      {col.key === "shipped" && (
                        <MiniButton variant="primary" onClick={() => onComplete(o.id)}>
                          签收
                        </MiniButton>
                      )}
                      <MiniButton onClick={() => onDelete(o.id)}>删除</MiniButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
