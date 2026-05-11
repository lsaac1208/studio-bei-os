import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseBodyRenderer } from "@/components/cases/CaseBodyRenderer";
import { CaseDemoMount } from "@/components/cases/CaseDemoMount";
import { Footer } from "@/components/marketing/Footer";
import { Topbar } from "@/components/marketing/Topbar";
import { getPublishedCaseBySlug } from "@/lib/queries/cases";

// 公开案例详情：force-dynamic 避免 build 时 generateStaticParams 连 DB
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const c = await getPublishedCaseBySlug(slug);
  if (!c) return { title: "案例未找到 · Studio Bei" };
  return {
    title: `${c.title} · Studio Bei 案例`,
    description: c.summary,
    openGraph: {
      title: c.title,
      description: c.summary,
      images: c.coverImage ? [{ url: c.coverImage }] : undefined,
    },
  };
}

export default async function CaseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const c = await getPublishedCaseBySlug(slug);
  if (!c) notFound();

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <Topbar />
      <main className="relative z-[1]">
        {/* ─── Cover ─── */}
        {c.coverImage && (
          <div className="border-hairline border-b">
            <div className="aspect-[21/9] w-full overflow-hidden bg-paper-soft sm:aspect-[24/9]">
              {/* biome-ignore lint/performance/noImgElement: hero cover */}
              <img src={c.coverImage} alt={c.title} className="h-full w-full object-cover" />
            </div>
          </div>
        )}

        {/* ─── Header ─── */}
        <header className="border-hairline border-b px-5 py-10 sm:py-14 lg:px-14">
          <div className="mx-auto max-w-3xl">
            <nav className="text-[12px] text-mute-soft">
              <Link href="/cases" className="transition hover:text-ink">
                ← 全部案例
              </Link>
            </nav>
            <h1 className="mt-3 font-serif text-3xl tracking-tight text-ink sm:text-4xl">
              {c.title}
            </h1>
            {c.subtitle && (
              <p className="mt-2 text-[15px] text-mute sm:text-[16px]">{c.subtitle}</p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-mute-soft">
              {c.industry && <span>{c.industry}</span>}
              {c.year && <span>· {c.year}</span>}
              {c.duration && <span>· {c.duration}</span>}
              {c.clientName && <span>· {c.clientName}</span>}
            </div>

            {c.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-hairline bg-paper-soft/60 px-2.5 py-0.5 text-[11px] text-mute"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {c.outcomeSummary && (
              <p className="mt-6 rounded-xl bg-ink px-5 py-3 font-medium text-[14px] text-paper">
                {c.outcomeSummary}
              </p>
            )}
          </div>
        </header>

        {/* ─── Demo ─── */}
        {c.demoComponent && (
          <section className="border-hairline border-b">
            <CaseDemoMount demoKey={c.demoComponent} />
          </section>
        )}

        {/* ─── Body ─── */}
        {c.body && (
          <section className="border-hairline border-b px-5 py-12 sm:py-14 lg:px-14">
            <div className="mx-auto max-w-3xl">
              <CaseBodyRenderer doc={c.body} />
            </div>
          </section>
        )}

        {/* ─── Metrics ─── */}
        {c.metrics.length > 0 && (
          <section className="border-hairline border-b bg-paper-soft/40 px-5 py-12 sm:py-14 lg:px-14">
            <div className="mx-auto max-w-5xl">
              <p className="font-mono text-[11px] text-mute tracking-[0.2em]">METRICS · 关键指标</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                {c.metrics.map((m) => (
                  <div
                    key={`${m.label}-${m.value}`}
                    className="rounded-2xl border border-hairline bg-white/70 p-5"
                  >
                    <p className="font-serif text-[28px] tracking-tight text-ink sm:text-[32px]">
                      {m.value}
                    </p>
                    <p className="mt-1 text-[13px] text-mute">{m.label}</p>
                    {m.note && <p className="mt-1 text-[11px] text-mute-soft">{m.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── Gallery ─── */}
        {c.gallery.length > 0 && (
          <section className="border-hairline border-b px-5 py-12 sm:py-14 lg:px-14">
            <div className="mx-auto max-w-5xl">
              <p className="font-mono text-[11px] text-mute tracking-[0.2em]">GALLERY · 项目截图</p>
              <ul className="mt-5 grid gap-5 sm:grid-cols-2">
                {c.gallery.map((g, idx) => (
                  <li
                    // biome-ignore lint/suspicious/noArrayIndexKey: gallery 顺序固定
                    key={idx}
                    className="space-y-2"
                  >
                    <div className="overflow-hidden rounded-xl border border-hairline bg-paper-soft">
                      {/* biome-ignore lint/performance/noImgElement: 公开图集 */}
                      <img src={g.url} alt={g.alt} className="h-auto w-full" />
                    </div>
                    {g.caption && <p className="text-[12px] text-mute">{g.caption}</p>}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ─── Quote ─── */}
        {c.clientQuote && (
          <section className="border-hairline border-b px-5 py-12 sm:py-14 lg:px-14">
            <div className="mx-auto max-w-3xl">
              <figure className="rounded-2xl border border-hairline bg-paper-soft/60 px-6 py-8 sm:px-10 sm:py-10">
                <blockquote className="font-serif text-[20px] leading-relaxed text-ink sm:text-[22px]">
                  「{c.clientQuote.text}」
                </blockquote>
                <figcaption className="mt-4 text-[13px] text-mute">
                  — {c.clientQuote.authorName}
                  {c.clientQuote.authorTitle && (
                    <span className="text-mute-soft">，{c.clientQuote.authorTitle}</span>
                  )}
                </figcaption>
              </figure>
            </div>
          </section>
        )}

        {/* ─── Tech Stack ─── */}
        {c.techStack.length > 0 && (
          <section className="border-hairline border-b px-5 py-10 lg:px-14">
            <div className="mx-auto max-w-3xl">
              <p className="font-mono text-[11px] text-mute tracking-[0.2em]">TECH STACK</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {c.techStack.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-hairline bg-white/60 px-3 py-1 text-[12px] text-ink"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── CTA ─── */}
        <section className="px-5 py-14 sm:py-20 lg:px-14">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-2xl tracking-tight text-ink sm:text-3xl">
              想做类似的项目？
            </h2>
            <p className="mt-3 text-[14px] text-mute">告诉我你的业务场景与时间，24 小时内回信</p>
            <Link
              href={`/contact?from=case-${c.slug}`}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3 font-medium text-[14px] text-paper transition hover:-translate-y-px hover:bg-studio-1"
            >
              联系我 →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
