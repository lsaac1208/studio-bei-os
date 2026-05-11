import { getPricingContent } from "@/lib/queries/landing";

/**
 * 数据来源：DB 表 `landing_blocks` (kind='pricing')。
 * 后台 `/admin/landing` 编辑；DB 为空时回退到 lib/landing-defaults.ts。
 */
export async function Pricing() {
  const tiers = await getPricingContent();
  return (
    <section
      id="pricing"
      className="border-hairline border-t bg-ink px-5 py-20 text-paper sm:px-8 lg:px-14 lg:py-32"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-16 max-w-3xl">
          <span className="font-mono text-[11px] text-paper/60 uppercase tracking-[0.14em]">
            Pricing / 05
          </span>
          <h2 className="mt-4 mb-4 font-extrabold text-[clamp(32px,5vw,56px)] leading-[1.05] tracking-[-0.035em]">
            先给预算区间，避免双方在
            <em className="font-serif font-semibold text-indus-2 italic">错误预期</em>
            里浪费时间。
          </h2>
          <p className="text-[15px] text-paper/60 leading-relaxed">
            下面是常见项目区间，实际报价会根据页面数量、后台复杂度、是否接入真实支付 / 短信 / 第三方
            API 调整。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {tiers.map((t) => (
            <article
              key={t.label}
              className={`flex min-h-[420px] flex-col rounded-[28px] border border-paper/15 p-7 ${
                t.featured
                  ? "-translate-y-4.5 bg-paper text-ink shadow-[0_32px_70px_rgba(0,0,0,0.28)]"
                  : "bg-paper/[0.06]"
              }`}
            >
              <span
                className={`font-mono text-[11px] uppercase tracking-[0.14em] ${
                  t.featured ? "text-mute" : "text-paper/60"
                }`}
              >
                {t.label}
              </span>
              <h3 className="mt-4.5 font-bold text-[clamp(30px,4vw,54px)] leading-none tracking-tight">
                {t.price}
              </h3>
              <p
                className={`mt-4 text-[14px] leading-relaxed ${
                  t.featured ? "text-mute" : "text-paper/68"
                }`}
              >
                {t.desc}
              </p>
              <ul
                className={`mt-auto space-y-2.5 pt-8 text-[13px] leading-snug ${
                  t.featured ? "text-ink-soft" : "text-paper/68"
                }`}
              >
                {t.bullets.map((b) => (
                  <li key={b} className="relative pl-4.5">
                    <span className="absolute top-[0.68em] left-0 h-1 w-2.5 bg-indus-2" />
                    {b}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
