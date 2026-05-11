type Stats = {
  total: number;
  hot: number;
  closed: number;
  conversion: number;
};

export function CaseHengyueHeader({ stats }: { stats: Stats }) {
  return (
    <header className="mx-auto mb-14 grid max-w-[1280px] items-end gap-10 lg:grid-cols-[2fr_1fr] lg:gap-14">
      <div>
        <div className="mb-5.5 flex flex-wrap items-center gap-3.5">
          <span className="font-mono text-[11px] text-mute uppercase tracking-[0.16em]">
            Case / 03
          </span>
          <span className="rounded-full border border-hairline-strong px-3 py-1 font-semibold text-[11px] text-ink uppercase tracking-[0.14em]">
            B2B 工厂 · 官网 · 询盘
          </span>
        </div>
        <h2 className="mb-5.5 font-bold text-[clamp(40px,6vw,80px)] text-ink leading-none tracking-[-0.04em]">
          恒越精密
          <small className="mt-3 block font-serif font-normal text-sm text-mute italic tracking-wider">
            Hengyue Precision
          </small>
        </h2>
        <p className="mb-5.5 max-w-[640px] text-[16px] text-ink-soft leading-[1.75]">
          一家做精密五金件的中型工厂，老板的核心痛点是：「官网每天有人看，但一年只接到几个像样的询盘」。
          我重做了官网，同时做了
          <strong className="rounded-sm bg-white/65 px-1 font-bold text-ink">
            表单 → 自动分级 → 销售跟进看板
          </strong>
          的内嵌 CRM。
        </p>
        <ul className="grid gap-2 text-[14px] leading-snug">
          {[
            "询盘表单按预算 / 月需求量自动判定意向等级",
            "销售看板：新询盘 → 跟进中 → 高意向 → 已成交",
            "统计来源、转化率、平均跟进天数等核心指标",
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
        <StatCard label="累计询盘" value={stats.total} meta="官网 / 外贸 / 展会自动汇总" />
        <StatCard label="高意向" value={stats.hot} meta="销售优先跟进" />
        <StatCard
          label="成交率"
          value={`${stats.conversion}%`}
          meta={`已成交 ${stats.closed} / ${stats.total}`}
        />
      </aside>
    </header>
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
