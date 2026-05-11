"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createFaq } from "@/actions/faq";

export function FaqNewForm() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = question.trim();
    const a = answer.trim();
    if (q.length < 2 || a.length < 2) {
      toast.error("问题与回答都至少 2 字");
      return;
    }
    startTransition(async () => {
      try {
        await createFaq({ question: q, answer: a });
        toast.success("FAQ 已添加");
        setQuestion("");
        setAnswer("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "添加失败");
      }
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-2xl border border-hairline bg-white/60 p-5"
    >
      <h2 className="font-serif text-base tracking-tight text-ink">新增 FAQ</h2>
      <div>
        <label
          htmlFor="faq-new-question"
          className="mb-1 block text-[11px] text-mute uppercase tracking-wider"
        >
          问题
        </label>
        <input
          id="faq-new-question"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={200}
          placeholder="例如：能不能只做一个页面的定制？"
          className="w-full rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[13px] outline-none transition placeholder:text-mute-soft focus:border-ink/40 focus:bg-white focus:ring-2 focus:ring-ink/8"
        />
      </div>
      <div>
        <label
          htmlFor="faq-new-answer"
          className="mb-1 block text-[11px] text-mute uppercase tracking-wider"
        >
          回答（支持 Markdown）
        </label>
        <textarea
          id="faq-new-answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={4}
          maxLength={4000}
          placeholder="可以。单页定制的起步在 8000 元，交付周期 2-3 周。"
          className="w-full resize-y rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[13px] outline-none transition placeholder:text-mute-soft focus:border-ink/40 focus:bg-white focus:ring-2 focus:ring-ink/8"
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-mute-soft tabular-nums">
          {question.length} / 200 · {answer.length} / 4000
        </p>
        <button
          type="submit"
          disabled={pending || !question.trim() || !answer.trim()}
          className="rounded-full bg-ink px-4 py-1.5 text-[12px] text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "添加中…" : "添加"}
        </button>
      </div>
    </form>
  );
}
