"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteFaq, moveFaq, updateFaq } from "@/actions/faq";
import type { Faq } from "@/db/schema";
import { cn } from "@/lib/utils";

interface Props {
  faq: Faq;
  isFirst: boolean;
  isLast: boolean;
}

export function FaqRow({ faq, isFirst, isLast }: Props) {
  const [editing, setEditing] = useState(false);
  const [question, setQuestion] = useState(faq.question);
  const [answer, setAnswer] = useState(faq.answer);
  const [pending, startTransition] = useTransition();

  const onTogglePublish = () => {
    startTransition(async () => {
      try {
        await updateFaq({ id: faq.id, published: !faq.published });
        toast.success(faq.published ? "已设为未发布" : "已发布");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "切换失败");
      }
    });
  };

  const onMove = (direction: "up" | "down") => {
    startTransition(async () => {
      try {
        await moveFaq({ id: faq.id, direction });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "移动失败");
      }
    });
  };

  const onDelete = () => {
    if (!confirm(`确定删除 FAQ「${faq.question}」？此操作不可撤销。`)) return;
    startTransition(async () => {
      try {
        await deleteFaq({ id: faq.id });
        toast.success("已删除");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "删除失败");
      }
    });
  };

  const onSaveEdit = () => {
    const q = question.trim();
    const a = answer.trim();
    if (q.length < 2 || a.length < 2) {
      toast.error("问题与回答都至少 2 字");
      return;
    }
    startTransition(async () => {
      try {
        await updateFaq({ id: faq.id, question: q, answer: a });
        toast.success("已保存");
        setEditing(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "保存失败");
      }
    });
  };

  const onCancelEdit = () => {
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setEditing(false);
  };

  return (
    <article
      className={cn(
        "rounded-2xl border bg-white/60 p-5",
        faq.published ? "border-hairline" : "border-hairline border-dashed opacity-70",
      )}
    >
      {editing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={200}
            className="w-full rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[14px] font-medium outline-none transition focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
          />
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
            maxLength={4000}
            className="w-full resize-y rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[13px] outline-none transition focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={pending}
              className="rounded-full border border-hairline px-3 py-1 text-[12px] text-mute transition hover:border-hairline-strong hover:text-ink"
            >
              取消
            </button>
            <button
              type="button"
              onClick={onSaveEdit}
              disabled={pending}
              className="rounded-full bg-ink px-4 py-1 text-[12px] text-paper transition hover:bg-ink/90 disabled:opacity-50"
            >
              {pending ? "保存中…" : "保存"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-medium text-[14px] text-ink">{faq.question}</h3>
            {!faq.published && (
              <span className="shrink-0 rounded-full border border-hairline bg-paper-soft/70 px-2 py-0.5 text-[10px] text-mute">
                未发布
              </span>
            )}
          </div>
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-mute">{faq.answer}</p>
        </div>
      )}

      {!editing && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-hairline border-t pt-3 text-[11px] text-mute">
          <button
            type="button"
            onClick={() => onMove("up")}
            disabled={pending || isFirst}
            className="rounded-md border border-hairline px-2 py-0.5 transition hover:border-hairline-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="上移"
          >
            ↑ 上移
          </button>
          <button
            type="button"
            onClick={() => onMove("down")}
            disabled={pending || isLast}
            className="rounded-md border border-hairline px-2 py-0.5 transition hover:border-hairline-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="下移"
          >
            ↓ 下移
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onTogglePublish}
            disabled={pending}
            className="rounded-md border border-hairline px-2 py-0.5 transition hover:border-hairline-strong hover:text-ink disabled:opacity-40"
          >
            {faq.published ? "设为未发布" : "发布"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={pending}
            className="rounded-md border border-hairline px-2 py-0.5 transition hover:border-hairline-strong hover:text-ink"
          >
            编辑
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="rounded-md border border-hairline px-2 py-0.5 transition hover:border-bad/50 hover:text-bad"
          >
            删除
          </button>
        </div>
      )}
    </article>
  );
}
