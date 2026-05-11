"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createLandingBlock,
  deleteLandingBlock,
  moveLandingBlock,
  updateLandingBlock,
} from "@/actions/landing";
import type { LandingBlockKind, LandingFitData } from "@/db/schema";
import { Field, RowActions, rowCardClass, SectionHeader } from "./shared";

interface FitItem {
  id: string;
  published: boolean;
  data: LandingFitData;
}

export function FitSection({ good, not }: { good: FitItem[]; not: FitItem[] }) {
  return (
    <section>
      <SectionHeader
        title="适合 / 不适合 · Fit"
        subtitle="首页倒数第二区，左右两栏「适合 / 暂不适合」"
        count={good.length + not.length}
      />

      <div className="space-y-6">
        <FitGroup
          kind="fit_good"
          title="✅ 更适合这些客户"
          items={good}
          placeholder="已经有稳定业务，但流程还靠微信、Excel、人工记录"
        />
        <FitGroup
          kind="fit_not"
          title="⏸ 暂时不太适合"
          items={not}
          placeholder="只想用极低预算仿一个大型平台"
        />
      </div>
    </section>
  );
}

function FitGroup({
  kind,
  title,
  items,
  placeholder,
}: {
  kind: Extract<LandingBlockKind, "fit_good" | "fit_not">;
  title: string;
  items: FitItem[];
  placeholder: string;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-serif text-[13px] tracking-tight text-ink">
        {title}
        <span className="ml-2 text-[11px] text-mute-soft">{items.length} 条</span>
      </h3>
      <FitNewForm kind={kind} placeholder={placeholder} />
      {items.length === 0 ? (
        <div className="rounded-2xl border border-hairline border-dashed bg-white/40 p-4 text-center text-[12px] text-mute-soft">
          尚未配置；首页正在使用代码默认内容。
        </div>
      ) : (
        items.map((it, i) => (
          <FitRow
            key={it.id}
            kind={kind}
            item={it}
            isFirst={i === 0}
            isLast={i === items.length - 1}
          />
        ))
      )}
    </div>
  );
}

function FitNewForm({
  kind,
  placeholder,
}: {
  kind: Extract<LandingBlockKind, "fit_good" | "fit_not">;
  placeholder: string;
}) {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error("内容不能为空");
      return;
    }
    startTransition(async () => {
      try {
        await createLandingBlock({ kind, data: { text: text.trim() } });
        toast.success("已添加");
        setText("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "添加失败");
      }
    });
  };

  return (
    <form
      onSubmit={submit}
      className="flex items-center gap-2 rounded-xl border border-hairline bg-white/60 px-3 py-2"
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={120}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-mute-soft"
      />
      <button
        type="submit"
        disabled={pending || !text.trim()}
        className="shrink-0 rounded-full bg-ink px-3 py-1 text-[11px] text-paper hover:bg-ink/90 disabled:opacity-50"
      >
        {pending ? "添加中…" : "+ 添加"}
      </button>
    </form>
  );
}

function FitRow({
  kind,
  item,
  isFirst,
  isLast,
}: {
  kind: Extract<LandingBlockKind, "fit_good" | "fit_not">;
  item: FitItem;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.data.text);
  const [pending, startTransition] = useTransition();

  const onSave = () => {
    if (!text.trim()) {
      toast.error("内容不能为空");
      return;
    }
    startTransition(async () => {
      try {
        await updateLandingBlock({ id: item.id, kind, data: { text: text.trim() } });
        toast.success("已保存");
        setEditing(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "保存失败");
      }
    });
  };

  const onCancel = () => {
    setText(item.data.text);
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
        await updateLandingBlock({ id: item.id, kind, published: !item.published });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "切换失败");
      }
    });

  const onDelete = () => {
    if (!confirm(`确定删除「${item.data.text.slice(0, 30)}…」？`)) return;
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
          <Field label="内容">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={120}
              className="w-full rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
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
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] leading-relaxed text-ink">{item.data.text}</p>
            {!item.published && (
              <span className="shrink-0 rounded-full border border-hairline bg-paper-soft/70 px-2 py-0.5 text-[10px] text-mute">
                未发布
              </span>
            )}
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
