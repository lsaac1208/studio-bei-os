"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { completeLeadNote } from "@/actions/leads";
import { StatusBadge } from "@/components/admin/leads/StatusBadge";
import type { LeadStatus, Priority } from "@/db/schema";
import { cn } from "@/lib/utils";

interface Props {
  noteId: string;
  noteContent: string;
  nextFollowUpAt: Date;
  leadId: string;
  leadCode: string;
  leadName: string;
  leadStatus: LeadStatus;
  leadPriority: Priority;
}

export function TodoRow({
  noteId,
  noteContent,
  nextFollowUpAt,
  leadId,
  leadCode,
  leadName,
  leadStatus,
  leadPriority,
}: Props) {
  const [pending, startTransition] = useTransition();

  const onComplete = () => {
    startTransition(async () => {
      try {
        const r = await completeLeadNote({ noteId });
        if (r.unchanged) {
          toast("已是完成状态", { duration: 2000 });
        } else {
          toast.success("已标记完成");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "操作失败");
      }
    });
  };

  return (
    <li
      className={cn(
        "flex flex-wrap items-start gap-x-4 gap-y-2 border-hairline border-b px-1 py-3 text-[13px] last:border-b-0",
        pending && "opacity-50",
      )}
    >
      {/* 时间 */}
      <time className="shrink-0 w-[88px] font-mono text-[12px] text-mute tabular-nums">
        {formatDateTime(nextFollowUpAt)}
      </time>

      {/* 客户 + 状态 */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/leads/${leadId}`}
            className="font-medium text-ink hover:underline underline-offset-2"
          >
            {leadName}
          </Link>
          <code className="text-[11px] text-mute-soft">{leadCode}</code>
          <StatusBadge status={leadStatus} size="sm" />
          {leadPriority === "HIGH" && (
            <span className="rounded-full border border-warn/30 bg-warn-bg px-1.5 py-0.5 text-[10px] text-warn">
              高优先级
            </span>
          )}
        </div>
        <p className="whitespace-pre-wrap break-words text-[12.5px] text-mute leading-relaxed">
          {noteContent}
        </p>
      </div>

      {/* 操作 */}
      <div className="flex shrink-0 items-center gap-2 self-center">
        <button
          type="button"
          onClick={onComplete}
          disabled={pending}
          className="rounded-full border border-hairline bg-white/60 px-3 py-1 text-[12px] text-mute transition hover:border-ok/50 hover:bg-ok-bg/40 hover:text-ok disabled:cursor-not-allowed"
        >
          {pending ? "…" : "完成"}
        </button>
        <Link
          href={`/admin/leads/${leadId}`}
          className="rounded-full border border-hairline bg-white/60 px-3 py-1 text-[12px] text-mute transition hover:border-hairline-strong hover:text-ink"
        >
          查看
        </Link>
      </div>
    </li>
  );
}

function formatDateTime(d: Date) {
  return new Date(d).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
