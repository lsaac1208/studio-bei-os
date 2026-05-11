"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { archiveLead } from "@/actions/leads";

interface Props {
  leadId: string;
  /** 已经归档时按钮变成 disabled */
  disabled?: boolean;
}

export function ArchiveButton({ leadId, disabled }: Props) {
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (disabled || pending) return;
    if (!confirm("确认归档此线索？归档后将从默认列表 / 看板中隐藏。")) return;

    startTransition(async () => {
      try {
        await archiveLead({ id: leadId });
        toast.success("已归档");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "归档失败");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || pending}
      className="rounded-full border border-hairline bg-white/60 px-3 py-1 text-[12px] text-mute transition hover:border-bad/50 hover:text-bad disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "归档中…" : disabled ? "已归档" : "归档此线索"}
    </button>
  );
}
