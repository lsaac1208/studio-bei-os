import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddNoteForm } from "@/components/admin/leads/AddNoteForm";
import { ArchiveButton } from "@/components/admin/leads/ArchiveButton";
import { PriorityActions } from "@/components/admin/leads/PriorityActions";
import { StatusActions } from "@/components/admin/leads/StatusActions";
import { StatusBadge } from "@/components/admin/leads/StatusBadge";
import { Timeline } from "@/components/admin/leads/Timeline";
import { getBitableConfig } from "@/lib/feishu/bitable";
import { BUDGET_OPTIONS, BUSINESS_TYPE_OPTIONS, TIMELINE_OPTIONS } from "@/lib/lead-options";
import { getLeadById, getLeadTimeline } from "@/lib/queries/leads";

export const metadata: Metadata = { title: "线索详情" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) notFound();

  const timeline = await getLeadTimeline(id);
  const bitableCfg = await getBitableConfig();
  const bitableUrl =
    bitableCfg && lead.bitableRecordId
      ? `https://feishu.cn/base/${bitableCfg.appToken}?table=${bitableCfg.tableId}&record=${lead.bitableRecordId}`
      : null;

  const businessLabel =
    BUSINESS_TYPE_OPTIONS.find((o) => o.value === lead.businessType)?.label ?? lead.businessType;
  const budgetLabel =
    BUDGET_OPTIONS.find((o) => o.value === lead.budgetRange)?.label ?? lead.budgetRange;
  const timelineLabel = lead.timeline
    ? (TIMELINE_OPTIONS.find((o) => o.value === lead.timeline)?.label ?? lead.timeline)
    : null;

  const isArchived = lead.status === "ARCHIVED";

  return (
    <div className="space-y-8">
      {/* 头部 */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/admin/leads"
            className="text-[12px] text-mute hover:text-ink hover:underline underline-offset-2"
          >
            ← 返回列表
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-2xl tracking-tight text-ink sm:text-3xl break-words">
              {lead.name}
            </h1>
            <StatusBadge status={lead.status} size="md" />
          </div>
          <p className="mt-1 font-mono text-[12px] text-mute-soft">{lead.code}</p>
        </div>
        <ArchiveButton leadId={lead.id} disabled={isArchived} />
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* 左侧：详情 + 时间线 */}
        <div className="space-y-6">
          {/* 客户基础信息 */}
          <Card title="客户信息">
            <DefList
              items={[
                { label: "姓名 / 公司", value: lead.name },
                {
                  label: "微信",
                  value: lead.wechat ? <Mono>{lead.wechat}</Mono> : <Empty />,
                },
                {
                  label: "电话",
                  value: lead.phone ? <Mono>{lead.phone}</Mono> : <Empty />,
                },
                {
                  label: "邮箱",
                  value: lead.email ? <Mono>{lead.email}</Mono> : <Empty />,
                },
              ]}
            />
          </Card>

          {/* 业务信息 */}
          <Card title="需求信息">
            <DefList
              items={[
                { label: "业务方向", value: businessLabel },
                { label: "预算", value: budgetLabel },
                { label: "时间", value: timelineLabel ?? <Empty /> },
                {
                  label: "痛点",
                  value: lead.painPoint ? (
                    <p className="whitespace-pre-wrap text-[13px] text-ink">{lead.painPoint}</p>
                  ) : (
                    <Empty />
                  ),
                },
                {
                  label: "完整描述",
                  value: (
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink">
                      {lead.message}
                    </p>
                  ),
                },
              ]}
            />
          </Card>

          {/* 添加备注 */}
          <Card title="添加备注">
            <AddNoteForm leadId={lead.id} />
          </Card>

          {/* 时间线 */}
          <Card title="时间线">
            <Timeline items={timeline} />
          </Card>
        </div>

        {/* 右侧：操作面板 + 元信息 */}
        <aside className="space-y-6">
          <Card title="状态">
            <StatusActions leadId={lead.id} current={lead.status} />
          </Card>

          <Card title="优先级">
            <PriorityActions leadId={lead.id} current={lead.priority} />
          </Card>

          <Card title="元信息">
            <dl className="space-y-2 text-[12px]">
              <Meta label="创建时间" value={formatFull(lead.createdAt)} />
              <Meta label="最后更新" value={formatFull(lead.updatedAt)} />
              {lead.source && (
                <Meta label="来源" value={<span className="break-all">{lead.source}</span>} />
              )}
              {lead.feishuMessageId && (
                <Meta label="飞书消息" value={<Mono>{lead.feishuMessageId}</Mono>} />
              )}
              {bitableUrl ? (
                <Meta
                  label="多维表格"
                  value={
                    <a
                      href={bitableUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink hover:underline underline-offset-2"
                    >
                      在飞书打开 ↗
                    </a>
                  }
                />
              ) : bitableCfg ? (
                <Meta label="多维表格" value={<span className="text-mute-soft">同步中…</span>} />
              ) : null}
              {lead.bitableSyncedAt && (
                <Meta label="上次同步" value={formatFull(lead.bitableSyncedAt)} />
              )}
            </dl>
          </Card>
        </aside>
      </div>
    </div>
  );
}

// ─── 辅助组件 ───

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-hairline bg-white/60 p-5">
      <h2 className="mb-4 font-serif text-base tracking-tight text-ink">{title}</h2>
      {children}
    </section>
  );
}

function DefList({ items }: { items: Array<{ label: string; value: React.ReactNode }> }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-[88px_1fr]">
      {items.map((it) => (
        <div key={it.label} className="contents">
          <dt className="text-[11px] text-mute uppercase tracking-wider sm:py-0.5">{it.label}</dt>
          <dd className="text-[13px] text-ink sm:py-0.5">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-mute-soft">{label}</dt>
      <dd className="text-right text-mute">{value}</dd>
    </div>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[12.5px]">{children}</span>;
}

function Empty() {
  return <span className="text-mute-soft">—</span>;
}

function formatFull(d: Date) {
  return new Date(d).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
