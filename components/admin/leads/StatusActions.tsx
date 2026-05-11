"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { changeLeadStatus } from "@/actions/leads";
import type { LeadStatus } from "@/db/schema";
import { LEAD_STATUS_OPTIONS } from "@/lib/lead-options";
import { cn } from "@/lib/utils";

const TONE_ACTIVE: Record<string, string> = {
  info: "border-info bg-info text-paper",
  ok: "border-ok bg-ok text-paper",
  warn: "border-warn bg-warn text-paper",
  bad: "border-bad bg-bad text-paper",
  mute: "border-mute bg-mute text-paper",
};

interface Props {
  leadId: string;
  current: LeadStatus;
  /** 是否显示 ARCHIVED 按钮（详情页通常用 ArchiveButton 单独做，此处隐藏） */
  showArchived?: boolean;
}

export function StatusActions({ leadId, current, showArchived = false }: Props) {
  const [pending, startTransition] = useTransition();

  const options = showArchived
    ? LEAD_STATUS_OPTIONS
    : LEAD_STATUS_OPTIONS.filter((o) => o.value !== "ARCHIVED");

  const onClick = (status: LeadStatus) => {
    if (status === current || pending) return;
    startTransition(async () => {
      try {
        await changeLeadStatus({ id: leadId, status });
        const label = LEAD_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
        toast.success(`已切换到「${label}」`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "切换失败");
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = opt.value === current;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={pending || active}
            onClick={() => onClick(opt.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-[12px] transition",
              active
                ? TONE_ACTIVE[opt.tone]
                : "border-hairline bg-white/60 text-mute hover:border-hairline-strong hover:text-ink",
              pending && !active && "cursor-wait opacity-60",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
