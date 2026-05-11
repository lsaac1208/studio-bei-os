import Link from "next/link";
import type { Lead } from "@/db/schema";
import { BUDGET_OPTIONS, BUSINESS_TYPE_OPTIONS } from "@/lib/lead-options";
import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";

interface Props {
  rows: Lead[];
}

export function LeadsTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-hairline bg-white/60 py-16 text-center text-sm text-mute">
        没有匹配的线索。
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-white/60">
      <div className="overflow-x-auto">
        <table className="min-w-full text-[13px]">
          <thead className="bg-paper-soft/60 text-[11px] text-mute uppercase tracking-wider">
            <tr>
              <Th className="pl-5">编号</Th>
              <Th>客户</Th>
              <Th>联系方式</Th>
              <Th>方向</Th>
              <Th>预算</Th>
              <Th>状态</Th>
              <Th>优先级</Th>
              <Th>提交时间</Th>
              <Th className="pr-5 text-right">操作</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {rows.map((lead) => (
              <LeadRow key={lead.id} lead={lead} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  const businessLabel =
    BUSINESS_TYPE_OPTIONS.find((o) => o.value === lead.businessType)?.label ?? lead.businessType;
  const budgetLabel =
    BUDGET_OPTIONS.find((o) => o.value === lead.budgetRange)?.label ?? lead.budgetRange;

  return (
    <tr className="transition hover:bg-paper-soft/40">
      <Td className="pl-5">
        <Link
          href={`/admin/leads/${lead.id}`}
          className="font-mono text-[12px] text-mute-soft hover:text-ink"
        >
          {lead.code}
        </Link>
      </Td>
      <Td>
        <Link
          href={`/admin/leads/${lead.id}`}
          className="font-medium text-ink hover:underline underline-offset-2"
        >
          {lead.name}
        </Link>
      </Td>
      <Td>
        <ContactInline lead={lead} />
      </Td>
      <Td className="text-mute">{businessLabel}</Td>
      <Td className="text-mute tabular-nums">{budgetLabel}</Td>
      <Td>
        <StatusBadge status={lead.status} />
      </Td>
      <Td>
        <PriorityBadge priority={lead.priority} />
      </Td>
      <Td className="text-mute-soft tabular-nums">{relativeTime(lead.createdAt)}</Td>
      <Td className="pr-5 text-right">
        <Link
          href={`/admin/leads/${lead.id}`}
          className="text-[12px] text-mute hover:text-ink hover:underline underline-offset-2"
        >
          查看 →
        </Link>
      </Td>
    </tr>
  );
}

function ContactInline({ lead }: { lead: Lead }) {
  const items = [
    lead.wechat ? { kind: "微信", value: lead.wechat } : null,
    lead.phone ? { kind: "电话", value: lead.phone } : null,
    lead.email ? { kind: "邮箱", value: lead.email } : null,
  ].filter((x): x is { kind: string; value: string } => x !== null);

  if (items.length === 0) return <span className="text-mute-soft">—</span>;

  return (
    <div className="flex flex-col gap-0.5">
      {items.map((it) => (
        <span key={it.kind} className="flex items-center gap-1.5 text-[12px]">
          <span className="text-mute-soft">{it.kind}</span>
          <span className="font-mono text-ink">{it.value}</span>
        </span>
      ))}
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`whitespace-nowrap px-3 py-3 text-left font-medium ${className ?? ""}`}>
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`whitespace-nowrap px-3 py-3 align-top ${className ?? ""}`}>{children}</td>;
}

function relativeTime(d: Date) {
  const now = Date.now();
  const t = new Date(d).getTime();
  const diffMin = Math.floor((now - t) / 60_000);
  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} 小时前`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `${diffD} 天前`;
  return new Date(d).toLocaleDateString("zh-CN");
}
