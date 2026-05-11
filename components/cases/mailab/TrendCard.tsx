import { formatMoneyShort } from "@/lib/case/format";
import { cn } from "@/lib/utils";

type Props = {
  series: number[];
};

const W = 200;
const H = 60;

export function TrendCard({ series }: Props) {
  const total = series.reduce((s, v) => s + v, 0);
  const yesterday = series[series.length - 2] || 1;
  const today = series[series.length - 1];
  const delta = ((today - yesterday) / yesterday) * 100;
  const trendUp = delta >= 0;

  // sparkline path
  const max = Math.max(...series, 1);
  const min = Math.min(...series, 0);
  const range = Math.max(max - min, 1);
  const points = series.map((v, i) => {
    const x = (i / (series.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 12) - 6;
    return [x, y] as const;
  });
  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const fillPath = `${linePath} L${W},${H} L0,${H} Z`;

  return (
    <div className="grid items-center gap-6 rounded-2xl border border-hairline bg-white/70 px-6.5 py-5.5 lg:grid-cols-[1fr_220px]">
      <div>
        <small className="block font-semibold text-[10px] text-mute uppercase tracking-[0.14em]">
          近 7 日销售额
        </small>
        <strong className="mt-2 block font-bold text-4xl tabular-nums tracking-[-0.04em]">
          {formatMoneyShort(total)}
        </strong>
        <span
          className={cn(
            "mt-2.5 inline-flex rounded-full px-2.5 py-0.5 font-mono font-bold text-[11px]",
            trendUp ? "bg-ok-bg text-ok" : "bg-bad-bg text-bad",
          )}
        >
          {trendUp ? "+" : ""}
          {delta.toFixed(1)}% vs 昨天
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        className="block h-16 w-full"
      >
        <path d={fillPath} fill="rgba(182,119,47,0.16)" stroke="none" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--color-bakery-1)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
