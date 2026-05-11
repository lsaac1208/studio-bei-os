import Link from "next/link";

const navItems = [
  { href: "#case-01", num: "01", label: "预约" },
  { href: "#case-02", num: "02", label: "订单库存" },
  { href: "#case-03", num: "03", label: "官网询盘" },
  { href: "#services", num: "04", label: "服务" },
  { href: "#pricing", num: "05", label: "报价" },
  { href: "#process", num: "06", label: "流程" },
  { href: "#faq", num: "07", label: "FAQ" },
];

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-6 border-hairline border-b bg-paper/85 px-5 py-3.5 backdrop-blur-xl backdrop-saturate-150 lg:px-14">
      <Link href="#top" className="flex items-center gap-3">
        <svg viewBox="0 0 28 28" className="h-7 w-7 flex-none rounded-lg bg-ink" aria-hidden="true">
          <rect x="7" y="8" width="4" height="12" rx="1" className="fill-paper" />
          <rect x="16" y="5" width="4" height="18" rx="1" className="fill-paper" />
        </svg>
        <span className="leading-tight">
          <strong className="block font-bold text-sm tracking-wide">Studio Bei</strong>
          <small className="block text-[11px] text-mute tracking-wider">
            独立全栈 / 成交型业务系统
          </small>
        </span>
      </Link>

      <nav aria-label="页面导航" className="hidden items-center gap-1 lg:flex">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex items-baseline gap-2 rounded-full px-3.5 py-2 font-semibold text-[13px] text-ink transition-colors hover:bg-paper-soft"
          >
            <em className="font-mono text-[11px] text-mute not-italic tracking-wider">
              {item.num}
            </em>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3.5">
        <Link
          href="#contact"
          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4.5 py-2 font-bold text-[13px] text-paper transition-all hover:-translate-y-px hover:bg-studio-1"
        >
          获取报价
        </Link>
      </div>
    </header>
  );
}
