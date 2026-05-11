import type { Metadata } from "next";
import { FaqNewForm } from "@/components/admin/faqs/FaqNewForm";
import { FaqRow } from "@/components/admin/faqs/FaqRow";
import { listFaqs } from "@/lib/queries/faq";

export const metadata: Metadata = { title: "FAQ 管理" };

export default async function AdminFaqsPage() {
  const items = await listFaqs({ includeUnpublished: true });
  const publishedCount = items.filter((f) => f.published).length;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-2xl tracking-tight text-ink sm:text-3xl">FAQ</h1>
        <p className="mt-1 text-[13px] text-mute">
          共 {items.length} 条，已发布 {publishedCount} 条。官网「常见问题」区只展示已发布项。
        </p>
      </header>

      <FaqNewForm />

      <section className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-hairline bg-white/60 p-8 text-center text-[13px] text-mute-soft">
            还没有任何 FAQ，先添加一条吧。
          </div>
        ) : (
          items.map((faq, idx) => (
            <FaqRow key={faq.id} faq={faq} isFirst={idx === 0} isLast={idx === items.length - 1} />
          ))
        )}
      </section>
    </div>
  );
}
