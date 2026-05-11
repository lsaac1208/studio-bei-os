import type { Metadata } from "next";
import Link from "next/link";
import { LeadsKanban } from "@/components/admin/leads/LeadsKanban";
import { KANBAN_VISIBLE_STATUSES, kanbanLeads } from "@/lib/queries/leads";

export const metadata: Metadata = { title: "线索看板" };

export default async function LeadsKanbanPage() {
  const data = await kanbanLeads();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-serif text-[12px] tracking-[0.3em] text-mute uppercase">Kanban</p>
          <h1 className="mt-2 font-serif text-2xl tracking-tight sm:text-3xl">线索看板</h1>
          <p className="mt-1 text-[12px] text-mute">共 {data.total} 条（不含归档）</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/leads"
            className="rounded-full border border-hairline bg-white/60 px-4 py-1.5 text-[13px] text-mute transition hover:border-hairline-strong hover:text-ink"
          >
            列表视图
          </Link>
        </div>
      </header>

      <LeadsKanban data={data} visibleStatuses={KANBAN_VISIBLE_STATUSES} />

      <p className="pt-2 text-center text-[11px] text-mute-soft">
        拖拽卡片切换状态；移动端建议使用列表视图操作。
      </p>
    </div>
  );
}
