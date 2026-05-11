import type { Metadata } from "next";
import Link from "next/link";
import { SearchInput } from "@/components/admin/SearchInput";
import { searchAll } from "@/lib/queries/search";

export const metadata: Metadata = { title: "搜索 · 管理" };

// 搜索结果跟随用户输入实时变化，标记动态以避免缓存
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

const STATUS_LABEL: Record<string, string> = {
  NEW: "新线索",
  CONTACTED: "已联系",
  QUALIFYING: "需求确认",
  QUOTED: "已报价",
  WON: "已成交",
  LOST: "未成交",
  ARCHIVED: "已归档",
};

const PRIORITY_LABEL: Record<string, string> = { LOW: "低", NORMAL: "中", HIGH: "高" };

const KIND_LABEL: Record<string, string> = {
  service: "服务套餐",
  pricing: "报价档位",
  process: "合作流程",
  fit_good: "适合客户",
  fit_not: "不适合客户",
};

export default async function AdminSearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const results = await searchAll(q);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-2xl tracking-tight text-ink sm:text-3xl">搜索</h1>
        <p className="mt-1 text-[13px] text-mute leading-relaxed">
          跨表搜：线索 / 案例 / FAQ / 首页内容。每类最多 10 条，按相关性 / 时间倒序。
        </p>
      </header>

      <SearchInput defaultValue={q} autoFocus />

      {!q && (
        <p className="rounded-2xl border border-hairline border-dashed bg-white/40 p-6 text-center text-[13px] text-mute-soft">
          输入关键词即可开始搜索；支持姓名、电话、微信、邮箱、案例标题、FAQ 问答、首页文案等。
        </p>
      )}

      {q && results.total === 0 && (
        <p className="rounded-2xl border border-hairline border-dashed bg-white/40 p-6 text-center text-[13px] text-mute-soft">
          没有找到「{q}」相关内容。
        </p>
      )}

      {q && results.total > 0 && (
        <div className="space-y-10">
          <p className="text-[12px] text-mute-soft">
            共 <span className="font-medium text-ink">{results.total}</span> 条结果
          </p>

          {results.leads.length > 0 && (
            <Section title="线索" count={results.leads.length} subtitle="点击查看完整跟进">
              {results.leads.map((h) => (
                <Link
                  key={h.id}
                  href={`/admin/leads/${h.id}`}
                  className="block rounded-2xl border border-hairline bg-white/60 p-4 transition hover:border-hairline-strong hover:bg-white/80"
                >
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-mono text-[11px] text-mute-soft tabular-nums">
                      {h.code}
                    </span>
                    <h3 className="font-medium text-[14px] text-ink">{h.name}</h3>
                    <span className="rounded-full border border-hairline bg-paper-soft/60 px-2 py-0.5 text-[10px] text-mute">
                      {STATUS_LABEL[h.status] ?? h.status}
                    </span>
                    <span className="rounded-full border border-hairline bg-paper-soft/60 px-2 py-0.5 text-[10px] text-mute">
                      P:{PRIORITY_LABEL[h.priority] ?? h.priority}
                    </span>
                  </div>
                  {h.contactSummary && (
                    <p className="mt-1 text-[12px] text-mute-soft">{h.contactSummary}</p>
                  )}
                  <p className="mt-1 text-[13px] text-mute leading-relaxed">{h.message}</p>
                </Link>
              ))}
            </Section>
          )}

          {results.cases.length > 0 && (
            <Section title="案例" count={results.cases.length} subtitle="点击进入案例编辑页">
              {results.cases.map((h) => (
                <Link
                  key={h.id}
                  href={`/admin/cases/${h.id}`}
                  className="block rounded-2xl border border-hairline bg-white/60 p-4 transition hover:border-hairline-strong hover:bg-white/80"
                >
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h3 className="font-medium text-[14px] text-ink">{h.title}</h3>
                    {h.industry && (
                      <span className="rounded-full border border-hairline bg-paper-soft/60 px-2 py-0.5 text-[10px] text-mute">
                        {h.industry}
                      </span>
                    )}
                    {!h.published && (
                      <span className="rounded-full border border-hairline bg-paper-soft/70 px-2 py-0.5 text-[10px] text-mute">
                        未发布
                      </span>
                    )}
                    <span className="ml-auto font-mono text-[11px] text-mute-soft">/{h.slug}</span>
                  </div>
                  <p className="mt-1 text-[13px] text-mute leading-relaxed">{h.summary}</p>
                </Link>
              ))}
            </Section>
          )}

          {results.faqs.length > 0 && (
            <Section title="FAQ" count={results.faqs.length} subtitle="跳转 FAQ 管理">
              {results.faqs.map((h) => (
                <Link
                  key={h.id}
                  href="/admin/faqs"
                  className="block rounded-2xl border border-hairline bg-white/60 p-4 transition hover:border-hairline-strong hover:bg-white/80"
                >
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-medium text-[14px] text-ink">{h.question}</h3>
                    {!h.published && (
                      <span className="rounded-full border border-hairline bg-paper-soft/70 px-2 py-0.5 text-[10px] text-mute">
                        未发布
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[13px] text-mute leading-relaxed">{h.answer}</p>
                </Link>
              ))}
            </Section>
          )}

          {results.landing.length > 0 && (
            <Section title="首页内容" count={results.landing.length} subtitle="跳转首页内容编辑">
              {results.landing.map((h) => (
                <Link
                  key={h.id}
                  href="/admin/landing"
                  className="block rounded-2xl border border-hairline bg-white/60 p-4 transition hover:border-hairline-strong hover:bg-white/80"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="rounded-full border border-hairline bg-paper-soft/60 px-2 py-0.5 text-[10px] text-mute">
                      {KIND_LABEL[h.blockKind] ?? h.blockKind}
                    </span>
                    {!h.published && (
                      <span className="rounded-full border border-hairline bg-paper-soft/70 px-2 py-0.5 text-[10px] text-mute">
                        未发布
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[13px] text-mute leading-relaxed">{h.preview}</p>
                </Link>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  count,
  children,
}: {
  title: string;
  subtitle?: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl tracking-tight text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[12px] text-mute-soft">{subtitle}</p>}
        </div>
        <span className="text-[11px] text-mute-soft tabular-nums">{count} 条</span>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
