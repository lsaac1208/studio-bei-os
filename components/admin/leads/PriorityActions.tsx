"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { changeLeadPriority } from "@/actions/leads";
import type { Priority } from "@/db/schema";
import { PRIORITY_OPTIONS } from "@/lib/lead-options";
import { cn } from "@/lib/utils";

const ACTIVE_CLASS: Record<string, string> = {
  HIGH: "border-bad bg-bad text-paper",
  NORMAL: "border-ink bg-ink text-paper",
  LOW: "border-mute bg-mute text-paper",
};

interface Props {
  leadId: string;
  current: Priority;
}

export function PriorityActions({ leadId, current }: Props) {
  const [pending, startTransition] = useTransition();

  const onClick = (priority: Priority) => {
    if (priority === current || pending) return;
    startTransition(async () => {
      try {
        await changeLeadPriority({ id: leadId, priority });
        const label = PRIORITY_OPTIONS.find((o) => o.value === priority)?.label ?? priority;
        toast.success(`优先级 → ${label}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "切换失败");
      }
    });
  };

  return (
    <div className="flex gap-1.5">
      {PRIORITY_OPTIONS.map((opt) => {
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
                ? ACTIVE_CLASS[opt.value]
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
