import { getServicesContent } from "@/lib/queries/landing";

/**
 * 数据来源：DB 表 `landing_blocks` (kind='service')。
 * 后台 `/admin/landing` 编辑；DB 为空时回退到 lib/landing-defaults.ts。
 */
export async function Services() {
  const packages = await getServicesContent();
  return (
    <section
      id="services"
      className="border-hairline border-t bg-paper px-5 py-20 sm:px-8 lg:px-14 lg:py-32"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-12 max-w-3xl">
          <span className="font-mono text-[11px] text-mute uppercase tracking-[0.14em]">
            Services / 04
          </span>
          <h2 className="mt-4 mb-4 font-extrabold text-[clamp(32px,5vw,56px)] leading-[1.05] tracking-[-0.035em]">
            把服务做成
            <em className="font-serif font-semibold text-studio-1 italic">可购买</em>
            的套餐，而不是只报价「写代码」。
          </h2>
          <p className="text-[15px] text-mute leading-relaxed">
            你可以根据当前业务阶段选择一个小系统先上线，也可以从一个流程切入，后续扩展成完整后台。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {packages.map((p) => (
            <article
              key={p.num}
              className="flex min-h-[410px] flex-col rounded-[28px] border border-hairline bg-white/40 p-6"
            >
              <span className="font-mono text-[11px] text-mute uppercase tracking-[0.14em]">
                {p.num}
              </span>
              <h3 className="mt-4.5 mb-3 font-bold text-[25px] tracking-tight">{p.title}</h3>
              <p className="text-[14px] text-mute leading-relaxed">{p.desc}</p>
              <ul className="mt-5.5 space-y-2.5 text-[13px] text-ink-soft leading-snug">
                {p.bullets.map((b) => (
                  <li key={b} className="relative pl-4.5">
                    <span className="absolute top-[0.68em] left-0 h-1 w-2.5 bg-studio-1" />
                    {b}
                  </li>
                ))}
              </ul>
              <strong className="mt-auto block border-hairline border-t pt-6 text-[14px] tracking-tight">
                {p.tagline}
              </strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
