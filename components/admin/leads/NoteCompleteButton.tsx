"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { completeLeadNote } from "@/actions/leads";

/**
 * 时间线里：未完成的待办 note 显示「完成」按钮，点击触发 completeLeadNote。
 */
export function NoteCompleteButton({ noteId }: { noteId: string }) {
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      try {
        const r = await completeLeadNote({ noteId });
        if (r.unchanged) toast("已是完成状态", { duration: 2000 });
        else toast.success("已完成");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "操作失败");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="rounded-full border border-hairline bg-white/60 px-2 py-0.5 text-[10px] text-mute transition hover:border-ok/50 hover:bg-ok-bg/40 hover:text-ok disabled:cursor-not-allowed"
    >
      {pending ? "…" : "完成"}
    </button>
  );
}
