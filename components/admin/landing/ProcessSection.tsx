"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createLandingBlock,
  deleteLandingBlock,
  moveLandingBlock,
  updateLandingBlock,
} from "@/actions/landing";
import type { LandingProcessData } from "@/db/schema";
import { Field, RowActions, rowCardClass, SectionHeader } from "./shared";

interface ProcessItem {
  id: string;
  published: boolean;
  data: LandingProcessData;
}

export function ProcessSection({ items }: { items: ProcessItem[] }) {
  return (
    <section>
      <SectionHeader
        title="合作流程 · Process"
        subtitle="首页第 6 区，5 步合作流程"
        count={items.length}
      />
      <NewProcessForm />
      <div className="mt-3 space-y-3">
        {items.length === 0 ? (
          <Empty />
        ) : (
          items.map((it, i) => (
            <ProcessRow key={it.id} item={it} isFirst={i === 0} isLast={i === items.length - 1} />
          ))
        )}
      </div>
    </section>
  );
}

function Empty() {
  return (
    <div className="rounded-2xl border border-hairline border-dashed bg-white/40 p-6 text-center text-[13px] text-mute-soft">
      尚未配置；首页正在使用代码默认内容。
    </div>
  );
}

function NewProcessForm() {
  const [num, setNum] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setNum("");
    setTitle("");
    setDesc("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!num.trim() || !title.trim() || !desc.trim()) {
      toast.error("所有字段必填");
      return;
    }
    startTransition(async () => {
      try {
        await createLandingBlock({
          kind: "process",
          data: { num: num.trim(), title: title.trim(), desc: desc.trim() },
        });
        toast.success("已添加");
        reset();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "添加失败");
      }
    });
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-2xl border border-hairline bg-white/60 p-5"
    >
      <h3 className="font-serif text-[14px] tracking-tight text-ink">新增流程步骤</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[100px_1fr]">
        <Field label="编号">
          <input
            type="text"
            value={num}
            onChange={(e) => setNum(e.target.value)}
            maxLength={8}
            placeholder="01"
            className="w-full rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
          />
        </Field>
        <Field label="标题">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="需求梳理"
            className="w-full rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
          />
        </Field>
      </div>
      <Field label="描述">
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={2}
          maxLength={400}
          placeholder="确认你现在怎么接单、记录、跟进、交付…"
          className="w-full resize-y rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
        />
      </Field>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-ink px-4 py-1.5 text-[12px] text-paper hover:bg-ink/90 disabled:opacity-50"
        >
          {pending ? "添加中…" : "添加"}
        </button>
      </div>
    </form>
  );
}

function ProcessRow({
  item,
  isFirst,
  isLast,
}: {
  item: ProcessItem;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [num, setNum] = useState(item.data.num);
  const [title, setTitle] = useState(item.data.title);
  const [desc, setDesc] = useState(item.data.desc);
  const [pending, startTransition] = useTransition();

  const onSave = () => {
    if (!num.trim() || !title.trim() || !desc.trim()) {
      toast.error("所有字段必填");
      return;
    }
    startTransition(async () => {
      try {
        await updateLandingBlock({
          id: item.id,
          kind: "process",
          data: { num: num.trim(), title: title.trim(), desc: desc.trim() },
        });
        toast.success("已保存");
        setEditing(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "保存失败");
      }
    });
  };

  const onCancel = () => {
    setNum(item.data.num);
    setTitle(item.data.title);
    setDesc(item.data.desc);
    setEditing(false);
  };

  const onMove = (direction: "up" | "down") =>
    startTransition(async () => {
      try {
        await moveLandingBlock({ id: item.id, direction });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "移动失败");
      }
    });

  const onTogglePublish = () =>
    startTransition(async () => {
      try {
        await updateLandingBlock({
          id: item.id,
          kind: "process",
          published: !item.published,
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "切换失败");
      }
    });

  const onDelete = () => {
    if (!confirm(`确定删除「${item.data.title}」？此操作不可撤销。`)) return;
    startTransition(async () => {
      try {
        await deleteLandingBlock({ id: item.id });
        toast.success("已删除");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "删除失败");
      }
    });
  };

  return (
    <article className={rowCardClass(item.published)}>
      {editing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[100px_1fr]">
            <Field label="编号">
              <input
                type="text"
                value={num}
                onChange={(e) => setNum(e.target.value)}
                maxLength={8}
                className="w-full rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
              />
            </Field>
            <Field label="标题">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                className="w-full rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
              />
            </Field>
          </div>
          <Field label="描述">
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              maxLength={400}
              className="w-full resize-y rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="rounded-full border border-hairline px-3 py-1 text-[12px] text-mute hover:border-hairline-strong hover:text-ink"
            >
              取消
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={pending}
              className="rounded-full bg-ink px-4 py-1 text-[12px] text-paper hover:bg-ink/90 disabled:opacity-50"
            >
              {pending ? "保存中…" : "保存"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-4">
            <span className="font-mono text-[12px] text-mute-soft tabular-nums">
              {item.data.num}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium text-[14px] text-ink">{item.data.title}</h3>
                {!item.published && (
                  <span className="shrink-0 rounded-full border border-hairline bg-paper-soft/70 px-2 py-0.5 text-[10px] text-mute">
                    未发布
                  </span>
                )}
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-mute">{item.data.desc}</p>
            </div>
          </div>
          <RowActions
            pending={pending}
            isFirst={isFirst}
            isLast={isLast}
            published={item.published}
            onMoveUp={() => onMove("up")}
            onMoveDown={() => onMove("down")}
            onTogglePublish={onTogglePublish}
            onEdit={() => setEditing(true)}
            onDelete={onDelete}
          />
        </>
      )}
    </article>
  );
}
