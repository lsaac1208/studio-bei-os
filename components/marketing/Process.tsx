import { getProcessContent } from "@/lib/queries/landing";

/**
 * 数据来源：DB 表 `landing_blocks` (kind='process')。
 * 后台 `/admin/landing` 编辑；DB 为空时回退到 lib/landing-defaults.ts。
 */
export async function Process() {
  const steps = await getProcessContent();
  return (
    <section
      id="process"
      className="border-hairline border-t bg-paper px-5 py-20 sm:px-8 lg:px-14 lg:py-32"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-12 max-w-3xl">
          <span className="font-mono text-[11px] text-mute uppercase tracking-[0.14em]">
            Process / 06
          </span>
          <h2 className="mt-4 mb-4 font-extrabold text-[clamp(32px,5vw,56px)] leading-[1.05] tracking-[-0.035em]">
            合作流程清楚，项目才不会卡在
            <em className="font-serif font-semibold text-studio-1 italic">「需求还没想好」</em>。
          </h2>
          <p className="text-[15px] text-mute leading-relaxed">
            我会先把业务流程讲清楚，再进入开发；每一步都有可确认的交付物，减少返工和误解。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s, i) => (
            <article
              key={s.num}
              className="relative min-h-[260px] overflow-hidden rounded-[28px] border border-hairline bg-white/40 p-6"
            >
              <span className="font-mono text-[11px] text-mute uppercase tracking-[0.14em]">
                {s.num}
              </span>
              <h3 className="mt-4.5 mb-3 font-bold text-[22px] tracking-tight">{s.title}</h3>
              <p className="text-[14px] text-mute leading-relaxed">{s.desc}</p>
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute right-5 bottom-4 font-bold text-[40px] text-mute-soft leading-none"
                >
                  →
                </span>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
