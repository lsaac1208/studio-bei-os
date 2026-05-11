"use client";

import { MiniButton } from "@/components/cases/primitives";
import { type Product, stockStatus } from "@/lib/case/mailab";
import { cn } from "@/lib/utils";

type Props = {
  products: Product[];
  onRestock: (id: string) => void;
};

const fillCls: Record<"ok" | "low" | "out", string> = {
  ok: "bg-ok",
  low: "bg-warn",
  out: "bg-bad",
};

export function StockBlock({ products, onRestock }: Props) {
  return (
    <div className="rounded-2xl border border-hairline bg-white/70 px-5.5 py-4.5">
      <div className="mb-3.5 flex items-baseline justify-between">
        <strong className="font-bold text-sm">库存预警</strong>
        <small className="text-[12px] text-mute">低于安全库存自动飘红</small>
      </div>

      <div className="grid">
        {products.map((p, i) => {
          const status = stockStatus(p);
          const percent = Math.min(100, Math.max(4, Math.round((p.stock / p.maxStock) * 100)));
          return (
            <div
              key={p.id}
              className={cn(
                "grid grid-cols-1 items-center gap-3 py-3.5 sm:grid-cols-[1fr_160px_auto] sm:gap-4.5",
                i > 0 && "border-hairline border-t",
                i === 0 && "pt-1",
              )}
            >
              <div className="grid gap-0.5">
                <strong className="font-bold text-[13px]">{p.name}</strong>
                <small className="font-mono text-[11px] text-mute tracking-wide">
                  {p.sku} · 安全库存 {p.safeStock} 件
                </small>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-center gap-2.5">
                <div className="h-1.5 overflow-hidden rounded-full bg-paper-deep">
                  <div
                    className={cn("h-full rounded-inherit transition-[width]", fillCls[status])}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="whitespace-nowrap font-mono text-[12px] text-mute tabular-nums">
                  {p.stock} / {p.maxStock}
                </span>
              </div>

              <MiniButton
                onClick={() => onRestock(p.id)}
                className="justify-self-start sm:justify-self-end"
              >
                +10
              </MiniButton>
            </div>
          );
        })}
      </div>
    </div>
  );
}
