import Link from "next/link";

const cases = [
  {
    href: "#case-01",
    num: "01",
    tag: "本地服务 · 预约",
    title: "栖光摄影",
    desc: "主理人小工作室在线预约 + 后台排期",
    statLabel: "预约个数",
    cardClass: "border-studio-1/25 bg-gradient-to-b from-studio-2/50 to-paper",
  },
  {
    href: "#case-02",
    num: "02",
    tag: "电商作坊 · 订单库存",
    title: "麦研所烘焙",
    desc: "取代 Excel 的订单流转和库存预警",
    statLabel: "销售额",
    cardClass: "border-bakery-1/25 bg-gradient-to-b from-bakery-2/60 to-paper",
  },
  {
    href: "#case-03",
    num: "03",
    tag: "B2B 工厂 · 官网询盘",
    title: "恒越精密",
    desc: "外贸工厂官网线索捕获 + 销售看板",
    statLabel: "线索条数",
    cardClass: "border-indus-1/25 bg-gradient-to-b from-[#dae0f0]/50 to-paper",
  },
];

const tickerLabels = [
  "客户在线下单",
  "库存自动扣减",
  "低库存预警",
  "线索意向分级",
  "销售跟进看板",
  "预约自动排期",
  "经营数据看板",
];

export function Hero() {
  // 双倍循环以实现无缝滚动
  const tickerLoop = [...tickerLabels, ...tickerLabels, ...tickerLabels, ...tickerLabels];

  return (
    <section className="mx-auto max-w-[1280px] px-5 pt-12 pb-10 sm:px-8 md:pt-20 lg:px-14 lg:pt-24 lg:pb-18">
      {/* meta strip */}
      <div className="mb-9 inline-flex items-center gap-2.5 rounded-full border border-hairline px-3 py-1.5 font-mono text-[12px] text-mute tracking-wider">
        <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-studio-1">
          <span className="absolute inset-0 animate-pulse-dot rounded-full bg-studio-1" />
        </span>
        <span>2026 / 自由职业业务系统官网 · 三个可交互演示</span>
      </div>

      {/* hero title */}
      <h1 className="mb-8 font-extrabold text-[clamp(40px,7.5vw,104px)] leading-[0.95] tracking-[-0.045em]">
        我帮中小商家把
        <br />
        <span className="relative z-[1] inline-block after:absolute after:inset-x-[-4px] after:bottom-1.5 after:-z-10 after:h-[18px] after:bg-studio-2 after:content-['']">
          线索 · 预约 · 订单 · 库存
        </span>
        <br />
        做成
        <em className="font-serif font-semibold text-studio-1 italic">真的能用</em>
        的系统。
      </h1>

      <p className="mb-16 max-w-[720px] text-[clamp(16px,1.5vw,19px)] text-ink-soft leading-[1.75]">
        不是只写页面，而是把混乱的微信沟通、Excel 表格、漏发错记和销售跟进，
        替换成可以上线使用、持续扩展、看得见业务结果的系统。
      </p>

      {/* case cards */}
      <div className="mb-14 grid grid-cols-1 gap-4 md:grid-cols-3">
        {cases.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`group relative flex min-h-[240px] flex-col gap-7 overflow-hidden rounded-3xl border p-6 transition-all hover:-translate-y-1 ${c.cardClass}`}
          >
            <div className="flex items-start justify-between">
              <span className="font-mono font-semibold text-3xl text-ink tracking-tight">
                {c.num}
              </span>
              <span className="text-right font-semibold text-[11px] text-mute uppercase tracking-[0.1em]">
                {c.tag}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <h3 className="font-bold text-3xl tracking-tight">{c.title}</h3>
              <p className="text-[13px] text-mute leading-relaxed">{c.desc}</p>
            </div>
            <div className="flex items-center justify-between border-hairline border-t pt-4 text-[12px] text-mute tabular-nums">
              <span>{c.statLabel}</span>
              <span className="font-bold text-base text-ink transition-transform group-hover:translate-x-1">
                →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* ticker */}
      <div
        aria-hidden="true"
        className="-mx-5 sm:-mx-8 lg:-mx-14 relative overflow-hidden border-hairline border-y bg-paper py-4.5 [mask-image:linear-gradient(90deg,transparent,black_80px,black_calc(100%-80px),transparent)]"
      >
        <div className="flex w-max animate-ticker gap-7 whitespace-nowrap">
          {tickerLoop.map((label, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: ticker 装饰用循环，无状态、相同 label 多次重复
            <div key={i} className="flex items-center gap-7">
              <span className="font-medium text-[13px] text-ink tracking-wide">{label}</span>
              <span className="text-mute">·</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
