import type { Metadata } from "next";
import Link from "next/link";
import { LeadsTable } from "@/components/admin/leads/LeadsTable";
import { LeadsToolbar } from "@/components/admin/leads/LeadsToolbar";
import { Pagination } from "@/components/admin/leads/Pagination";
import type { BusinessType, LeadStatus } from "@/db/schema";
import { BUSINESS_TYPE_OPTIONS, LEAD_STATUS_OPTIONS } from "@/lib/lead-options";
import { listLeads } from "@/lib/queries/leads";

export const metadata: Metadata = { title: "线索列表" };

interface PageProps {
  // Next.js 16: searchParams is a Promise
  searchParams: Promise<{
    status?: string;
    businessType?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function LeadsListPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const validStatuses = LEAD_STATUS_OPTIONS.map((o) => o.value);
  const validBusinessTypes = BUSINESS_TYPE_OPTIONS.map((o) => o.value);

  const status =
    sp.status && (validStatuses as string[]).includes(sp.status)
      ? (sp.status as LeadStatus)
      : undefined;
  const businessType =
    sp.businessType && (validBusinessTypes as string[]).includes(sp.businessType)
      ? (sp.businessType as BusinessType)
      : undefined;
  const q = sp.q?.trim() || undefined;
  const page = Number.parseInt(sp.page ?? "1", 10) || 1;

  const result = await listLeads({ status, businessType, q, page, pageSize: 20 });

  // 构造分页 URL（保留其他筛选）
  const baseSp = new URLSearchParams();
  if (status) baseSp.set("status", status);
  if (businessType) baseSp.set("businessType", businessType);
  if (q) baseSp.set("q", q);
  const buildHref = (p: number) => {
    const next = new URLSearchParams(baseSp);
    if (p > 1) next.set("page", String(p));
    const qs = next.toString();
    return qs ? `/admin/leads?${qs}` : "/admin/leads";
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-serif text-[12px] tracking-[0.3em] text-mute uppercase">Leads</p>
          <h1 className="mt-2 font-serif text-2xl tracking-tight sm:text-3xl">线索列表</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/leads/kanban"
            className="rounded-full border border-hairline bg-white/60 px-4 py-1.5 text-[13px] text-mute transition hover:border-hairline-strong hover:text-ink"
          >
            看板视图
          </Link>
        </div>
      </header>

      <LeadsToolbar
        totalLabel={`共 ${result.total} 条 ${q || status || businessType ? "（已筛选）" : ""}`}
      />

      <LeadsTable rows={result.rows} />

      <Pagination page={result.page} pageCount={result.pageCount} buildHref={buildHref} />
    </div>
  );
}
