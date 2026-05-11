import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/marketing/Footer";
import { Topbar } from "@/components/marketing/Topbar";
import { listCases } from "@/lib/queries/cases";

// 公开案例列表：force-dynamic 避免 build 时 SSG 预渲染（构建期 DB 不可达）
// 单次 RSC 渲染开销很小（几十 ms），小流量站点接受
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "作品案例 · Studio Bei",
  description: "Studio Bei 完成的全栈业务系统：预约、订单、库存、官网询盘等真实交付。",
};

export default async function CasesIndexPage() {
  const items = await listCases();

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <Topbar />
      <main className="relative z-[1]">
        <section className="border-hairline border-b px-5 py-12 sm:py-16 lg:px-14">
          <div className="mx-auto max-w-[1280px]">
            <p className="font-mono text-[11px] text-mute tracking-[0.2em]">CASES</p>
            <h1 className="mt-2 font-serif text-3xl tracking-tight text-ink sm:text-4xl">
              作品案例
            </h1>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-mute sm:text-[15px]">
              不只是好看的页面，而是真正在跑、能直接帮客户省人工 / 接单的系统。
            </p>
          </div>
        </section>

        <section className="px-5 py-10 sm:py-14 lg:px-14">
          <div className="mx-auto max-w-[1280px]">
            {items.length === 0 ? (
              <p className="rounded-2xl border border-hairline bg-paper-soft/40 px-6 py-12 text-center text-[13px] text-mute-soft">
                还没有公开的案例。
              </p>
            ) : (
              <ul className="grid gap-6 md:grid-cols-2 lg:gap-8">
                {items.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/cases/${c.slug}`}
                      className="group block overflow-hidden rounded-2xl border border-hairline bg-white/60 transition hover:border-hairline-strong hover:shadow-md"
                    >
                      <div className="aspect-[16/9] overflow-hidden bg-paper-soft">
                        {c.coverImage ? (
                          // biome-ignore lint/performance/noImgElement: 列表卡片，按需用原图
                          <img
                            src={c.coverImage}
                            alt={c.title}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[12px] text-mute-soft">
                            无封面
                          </div>
                        )}
                      </div>
                      <div className="space-y-2.5 p-5">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-mute-soft">
                          {c.industry && <span>{c.industry}</span>}
                          {c.year && <span>· {c.year}</span>}
                          {c.duration && <span>· {c.duration}</span>}
                        </div>
                        <h2 className="font-serif text-[20px] tracking-tight text-ink">
                          {c.title}
                        </h2>
                        {c.subtitle && <p className="text-[13px] text-mute">{c.subtitle}</p>}
                        <p className="line-clamp-3 text-[13px] leading-relaxed text-mute">
                          {c.summary}
                        </p>
                        {c.outcomeSummary && (
                          <p className="rounded-md bg-ink/4 px-3 py-1.5 font-medium text-[12px] text-ink">
                            {c.outcomeSummary}
                          </p>
                        )}
                        {c.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {c.tags.slice(0, 4).map((t) => (
                              <span
                                key={t}
                                className="rounded-full border border-hairline bg-paper-soft/60 px-2 py-0.5 text-[10.5px] text-mute"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
