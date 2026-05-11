"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createLandingBlock,
  deleteLandingBlock,
  moveLandingBlock,
  updateLandingBlock,
} from "@/actions/landing";
import type { LandingServiceData } from "@/db/schema";
import { BulletsEditor, Field, RowActions, rowCardClass, SectionHeader } from "./shared";

interface ServiceItem {
  id: string;
  published: boolean;
  data: LandingServiceData;
}

export function ServiceSection({ items }: { items: ServiceItem[] }) {
  return (
    <section>
      <SectionHeader
        title="服务套餐 · Services"
        subtitle="首页第 4 区，4 张卡片展示业务方向"
        count={items.length}
      />
      <NewServiceForm />
      <div className="mt-3 space-y-3">
        {items.length === 0 ? (
          <EmptyHint />
        ) : (
          items.map((it, i) => (
            <ServiceRow key={it.id} item={it} isFirst={i === 0} isLast={i === items.length - 1} />
          ))
        )}
      </div>
    </section>
  );
}

function EmptyHint() {
  return (
    <div className="rounded-2xl border border-hairline border-dashed bg-white/40 p-6 text-center text-[13px] text-mute-soft">
      尚未配置；首页正在使用代码默认内容。点上方「添加」即可开始定制。
    </div>
  );
}

function NewServiceForm() {
  const [num, setNum] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [bullets, setBullets] = useState<string[]>([]);
  const [tagline, setTagline] = useState("");
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setNum("");
    setTitle("");
    setDesc("");
    setBullets([]);
    setTagline("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!num.trim() || !title.trim() || !desc.trim() || !tagline.trim() || bullets.length === 0) {
      toast.error("所有字段必填，且 bullets 至少 1 条");
      return;
    }
    startTransition(async () => {
      try {
        await createLandingBlock({
          kind: "service",
          data: {
            num: num.trim(),
            title: title.trim(),
            desc: desc.trim(),
            bullets,
            tagline: tagline.trim(),
          },
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
      <h3 className="font-serif text-[14px] tracking-tight text-ink">新增服务套餐</h3>
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
            placeholder="预约 / 排期系统"
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
          placeholder="适合摄影、美容美甲、宠物店、培训、诊所…"
          className="w-full resize-y rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
        />
      </Field>
      <Field label="要点（每行一条）" hint={`已有 ${bullets.length} 条`}>
        <BulletsEditor value={bullets} onChange={setBullets} placeholder="客户在线选择服务与时间" />
      </Field>
      <Field label="底部 tagline">
        <input
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          maxLength={80}
          placeholder="从漏消息变成可管理排期"
          className="w-full rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
        />
      </Field>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-ink px-4 py-1.5 text-[12px] text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "添加中…" : "添加"}
        </button>
      </div>
    </form>
  );
}

function ServiceRow({
  item,
  isFirst,
  isLast,
}: {
  item: ServiceItem;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [num, setNum] = useState(item.data.num);
  const [title, setTitle] = useState(item.data.title);
  const [desc, setDesc] = useState(item.data.desc);
  const [bullets, setBullets] = useState<string[]>(item.data.bullets);
  const [tagline, setTagline] = useState(item.data.tagline);
  const [pending, startTransition] = useTransition();

  const onSave = () => {
    if (!num.trim() || !title.trim() || !desc.trim() || !tagline.trim() || bullets.length === 0) {
      toast.error("所有字段必填，且 bullets 至少 1 条");
      return;
    }
    startTransition(async () => {
      try {
        await updateLandingBlock({
          id: item.id,
          kind: "service",
          data: {
            num: num.trim(),
            title: title.trim(),
            desc: desc.trim(),
            bullets,
            tagline: tagline.trim(),
          },
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
    setBullets(item.data.bullets);
    setTagline(item.data.tagline);
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
          kind: "service",
          published: !item.published,
        });
        toast.success(item.published ? "已设为未发布" : "已发布");
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
          <Field label="要点（每行一条）">
            <BulletsEditor value={bullets} onChange={setBullets} />
          </Field>
          <Field label="底部 tagline">
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              maxLength={80}
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
              <ul className="mt-2 space-y-1 text-[12px] text-ink-soft">
                {item.data.bullets.map((b) => (
                  <li key={b} className="pl-3 before:mr-1.5 before:content-['·']">
                    {b}
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-hairline border-t pt-2 text-[12px] tracking-tight text-ink">
                {item.data.tagline}
              </p>
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
