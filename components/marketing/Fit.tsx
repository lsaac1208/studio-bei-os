import { getFitContent } from "@/lib/queries/landing";

/**
 * 数据来源：DB 表 `landing_blocks` (kind='fit_good' / 'fit_not')。
 * 后台 `/admin/landing` 编辑；DB 为空时回退到 lib/landing-defaults.ts。
 */
export async function Fit() {
  const { good, not } = await getFitContent();
  const goodFit = good.map((g) => g.text);
  const notFit = not.map((n) => n.text);
  return (
    <section aria-label="适合客户" className="bg-paper px-5 pb-20 sm:px-8 lg:px-14 lg:pb-32">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-4.5 lg:grid-cols-2">
        <article className="rounded-[28px] border border-hairline bg-studio-bg p-7 lg:p-12">
          <span className="font-mono text-[11px] text-mute uppercase tracking-[0.14em]">
            Good Fit
          </span>
          <h2 className="mt-4 mb-7 font-extrabold text-[clamp(34px,4.5vw,68px)] leading-none tracking-tight">
            更适合
            <br />
            这些客户
          </h2>
          <ul className="space-y-2.5 text-[15px] text-ink-soft leading-snug">
            {goodFit.map((item) => (
              <li key={item} className="relative pl-4.5">
                <span className="absolute top-[0.68em] left-0 h-1 w-2.5 bg-studio-1" />
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[28px] border border-hairline bg-paper-soft p-7 text-mute lg:p-12">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em]">Not Fit</span>
          <h2 className="mt-4 mb-7 font-extrabold text-[clamp(34px,4.5vw,68px)] leading-none tracking-tight">
            暂时
            <br />
            不太适合
          </h2>
          <ul className="space-y-2.5 text-[15px] leading-snug">
            {notFit.map((item) => (
              <li key={item} className="relative pl-4.5">
                <span className="absolute top-[0.68em] left-0 h-1 w-2.5 bg-mute-soft" />
                {item}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
