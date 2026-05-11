"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addLeadNote } from "@/actions/leads";

interface Props {
  leadId: string;
}

export function AddNoteForm({ leadId }: Props) {
  const [content, setContent] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      toast.error("备注不能为空");
      return;
    }
    if (trimmed.length > 2000) {
      toast.error("备注最多 2000 字");
      return;
    }

    startTransition(async () => {
      try {
        await addLeadNote({
          leadId,
          content: trimmed,
          nextFollowUpAt: followUp ? new Date(followUp).toISOString() : undefined,
        });
        toast.success("备注已添加");
        setContent("");
        setFollowUp("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "添加失败");
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="例如：客户希望先看 Demo；下周一下午约电话…"
        className="w-full resize-y rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[13px] outline-none transition placeholder:text-mute-soft focus:border-ink/40 focus:bg-white focus:ring-2 focus:ring-ink/8"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-[12px] text-mute">
          下次跟进
          <input
            type="datetime-local"
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
            className="rounded-md border border-hairline bg-white/70 px-2 py-1 text-[12px] outline-none transition focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
          />
        </label>
        <div className="flex items-center gap-3 text-[11px] text-mute-soft">
          <span className="tabular-nums">{content.length} / 2000</span>
          <button
            type="submit"
            disabled={pending || !content.trim()}
            className="rounded-full bg-ink px-4 py-1.5 text-[12px] text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "添加中…" : "添加备注"}
          </button>
        </div>
      </div>
    </form>
  );
}
