"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { changeLeadStatus } from "@/actions/leads";
import type { Lead, LeadStatus } from "@/db/schema";
import { BUDGET_OPTIONS, LEAD_STATUS_OPTIONS } from "@/lib/lead-options";
import type { KanbanResult } from "@/lib/queries/leads";
import { cn } from "@/lib/utils";
import { PriorityBadge } from "./PriorityBadge";

const DRAG_MIME = "application/x-studio-bei-lead";

type OptimisticAction = { leadId: string; toStatus: LeadStatus };

const COLUMN_TONE_BAR: Record<string, string> = {
  info: "bg-info",
  ok: "bg-ok",
  warn: "bg-warn",
  bad: "bg-bad",
  mute: "bg-mute",
};

interface Props {
  data: KanbanResult;
  visibleStatuses: LeadStatus[];
}

export function LeadsKanban({ data, visibleStatuses }: Props) {
  const [, startTransition] = useTransition();
  const [dragOverCol, setDragOverCol] = useState<LeadStatus | null>(null);

  // useOptimistic: 拖拽即时生效，server action revalidate 后用真值覆盖
  const [optimistic, applyOptimistic] = useOptimistic(
    data.groups,
    (state, action: OptimisticAction) => {
      const next: typeof state = {
        NEW: [...state.NEW],
        CONTACTED: [...state.CONTACTED],
        QUALIFYING: [...state.QUALIFYING],
        QUOTED: [...state.QUOTED],
        WON: [...state.WON],
        LOST: [...state.LOST],
        ARCHIVED: [...state.ARCHIVED],
      };
      let moved: Lead | null = null;
      for (const s of Object.keys(next) as LeadStatus[]) {
        const idx = next[s].findIndex((l) => l.id === action.leadId);
        if (idx >= 0) {
          moved = next[s][idx];
          next[s] = next[s].filter((l) => l.id !== action.leadId);
          break;
        }
      }
      if (moved) {
        next[action.toStatus] = [{ ...moved, status: action.toStatus }, ...next[action.toStatus]];
      }
      return next;
    },
  );

  const handleDrop = (targetStatus: LeadStatus, leadId: string, fromStatus: LeadStatus) => {
    setDragOverCol(null);
    if (fromStatus === targetStatus) return;
    startTransition(async () => {
      applyOptimistic({ leadId, toStatus: targetStatus });
      try {
        await changeLeadStatus({ id: leadId, status: targetStatus });
        const label = LEAD_STATUS_OPTIONS.find((o) => o.value === targetStatus)?.label;
        toast.success(`已移动到「${label}」`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "移动失败，已回滚");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {visibleStatuses.map((status) => {
        const opt = LEAD_STATUS_OPTIONS.find((o) => o.value === status);
        const items = optimistic[status] ?? [];
        const isOver = dragOverCol === status;
        return (
          // biome-ignore lint/a11y/useSemanticElements: section + role=region 会触发 noRedundantRoles，section + onDragOver 会触发 noStaticElementInteractions，三规则死锁，故选择 div + role
          <div
            key={status}
            role="region"
            aria-label={`${opt?.label ?? status}列，拖放线索卡片可移动到此状态`}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (dragOverCol !== status) setDragOverCol(status);
            }}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              if (dragOverCol === status) setDragOverCol(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const payload = e.dataTransfer.getData(DRAG_MIME);
              if (!payload) return;
              try {
                const { leadId, fromStatus } = JSON.parse(payload) as {
                  leadId: string;
                  fromStatus: LeadStatus;
                };
                handleDrop(status, leadId, fromStatus);
              } catch {
                /* ignore malformed payload */
              }
            }}
            className={cn(
              "flex min-w-0 flex-col rounded-2xl border bg-white/60 transition md:min-w-[240px]",
              isOver ? "border-ink/40 bg-paper-soft/30 ring-2 ring-ink/10" : "border-hairline",
            )}
          >
            <header className="flex items-center justify-between gap-2 border-hairline border-b px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={cn("h-2 w-2 rounded-full", COLUMN_TONE_BAR[opt?.tone ?? "mute"])}
                />
                <h3 className="font-medium text-[13px] text-ink">{opt?.label ?? status}</h3>
              </div>
              <span className="rounded-full bg-paper-soft/60 px-2 py-0.5 text-[11px] text-mute tabular-nums">
                {items.length}
              </span>
            </header>
            <div className="flex flex-1 flex-col gap-2 p-3">
              {items.length === 0 ? (
                <p className="py-6 text-center text-[12px] text-mute-soft">
                  {isOver ? "释放以移动到这里" : "空"}
                </p>
              ) : (
                items.map((lead) => <KanbanCard key={lead.id} lead={lead} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({ lead }: { lead: Lead }) {
  const [dragging, setDragging] = useState(false);
  const budgetLabel =
    BUDGET_OPTIONS.find((o) => o.value === lead.budgetRange)?.label ?? lead.budgetRange;
  const contact = lead.wechat || lead.phone || lead.email;

  return (
    <Link
      href={`/admin/leads/${lead.id}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData(
          DRAG_MIME,
          JSON.stringify({ leadId: lead.id, fromStatus: lead.status }),
        );
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      className={cn(
        "group block cursor-grab rounded-xl border border-hairline bg-paper-soft/40 p-3 text-[12px] transition active:cursor-grabbing",
        "hover:border-hairline-strong hover:bg-white hover:shadow-sm",
        dragging && "opacity-40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-[13px] text-ink">{lead.name}</span>
        {lead.priority === "HIGH" && <PriorityBadge priority="HIGH" />}
      </div>
      <p className="mt-1 font-mono text-[10px] text-mute-soft">{lead.code}</p>
      {contact && (
        <p className="mt-1.5 truncate text-[11px] text-mute" title={contact}>
          {contact}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span className="text-mute-soft">{budgetLabel}</span>
        <span className="text-mute-soft tabular-nums">{shortRelTime(lead.createdAt)}</span>
      </div>
    </Link>
  );
}

function shortRelTime(d: Date) {
  const now = Date.now();
  const t = new Date(d).getTime();
  const diffMin = Math.floor((now - t) / 60_000);
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d`;
}
