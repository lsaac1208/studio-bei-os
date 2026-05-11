import type { Metadata } from "next";
import Link from "next/link";
import { CaseRow } from "@/components/admin/cases/CaseRow";
import { listCases } from "@/lib/queries/cases";

export const metadata: Metadata = { title: "案例管理" };

export default async function AdminCasesPage() {
  const items = await listCases({ includeUnpublished: true });
  const publishedCount = items.filter((c) => c.published).length;
  const featuredCount = items.filter((c) => c.featured && c.published).length;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl tracking-tight text-ink sm:text-3xl">案例</h1>
          <p className="mt-1 text-[13px] text-mute">
            共 {items.length} 个，已发布 {publishedCount}，首页推荐 {featuredCount}。仅
            <strong className="font-medium text-ink"> 已发布 </strong>
            的案例会出现在 <code className="text-mute-soft">/cases</code> 公开页。
          </p>
        </div>
        <Link
          href="/admin/cases/new"
          className="rounded-full bg-ink px-5 py-2 text-[13px] text-paper transition hover:bg-ink/90"
        >
          + 新建案例
        </Link>
      </header>

      <section className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-hairline bg-white/60 p-12 text-center">
            <p className="text-[14px] text-mute">还没有任何案例</p>
            <p className="mt-2 text-[12px] text-mute-soft">
              点击右上角 <strong className="text-ink">+ 新建案例</strong> 开始
            </p>
          </div>
        ) : (
          items.map((c, idx) => (
            <CaseRow key={c.id} row={c} isFirst={idx === 0} isLast={idx === items.length - 1} />
          ))
        )}
      </section>
    </div>
  );
}
