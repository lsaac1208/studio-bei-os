import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseForm } from "@/components/admin/cases/CaseForm";
import { getCaseById } from "@/lib/queries/cases";
import type { CaseUpsertInput } from "@/lib/validators";

export const metadata: Metadata = { title: "编辑案例" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCasePage({ params }: PageProps) {
  const { id } = await params;
  const row = await getCaseById(id);
  if (!row) notFound();

  // 把 DB 行映射到 CaseUpsertInput 形状（null → "" / [] / null）
  const initial: Partial<CaseUpsertInput> = {
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? "",
    summary: row.summary,
    outcomeSummary: row.outcomeSummary ?? "",
    clientName: row.clientName ?? "",
    industry: row.industry ?? "",
    year: row.year ?? null,
    duration: row.duration ?? "",
    coverImage: row.coverImage ?? "",
    body: row.body ?? null,
    clientQuote: row.clientQuote
      ? {
          text: row.clientQuote.text,
          authorName: row.clientQuote.authorName,
          authorTitle: row.clientQuote.authorTitle ?? "",
        }
      : null,
    demoComponent:
      row.demoComponent === "qiguang" ||
      row.demoComponent === "mailab" ||
      row.demoComponent === "hengyue"
        ? row.demoComponent
        : null,
    tags: row.tags,
    techStack: row.techStack,
    metrics: row.metrics.map((m) => ({
      label: m.label,
      value: m.value,
      note: m.note ?? "",
    })),
    gallery: row.gallery.map((g) => ({
      url: g.url,
      alt: g.alt,
      caption: g.caption ?? "",
    })),
    published: row.published,
    featured: row.featured,
  };

  return (
    <div className="space-y-6">
      <header>
        <nav className="text-[12px] text-mute-soft">
          <Link href="/admin/cases" className="transition hover:text-ink">
            案例
          </Link>
          <span className="mx-1.5">/</span>
          <span className="truncate">{row.title}</span>
        </nav>
        <h1 className="mt-2 font-serif text-2xl tracking-tight text-ink sm:text-3xl">编辑案例</h1>
        <p className="mt-1 text-[13px] text-mute">
          修改后点击右下角「保存修改」即可生效；公开页 60 秒内自动刷新
        </p>
      </header>
      <CaseForm mode="edit" caseId={row.id} initial={initial} />
    </div>
  );
}
