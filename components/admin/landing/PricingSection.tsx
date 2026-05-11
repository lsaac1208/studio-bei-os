"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createLandingBlock,
  deleteLandingBlock,
  moveLandingBlock,
  updateLandingBlock,
} from "@/actions/landing";
import type { LandingPricingData } from "@/db/schema";
import { BulletsEditor, Field, RowActions, rowCardClass, SectionHeader } from "./shared";

interface PricingItem {
  id: string;
  published: boolean;
  data: LandingPricingData;
}

export function PricingSection({ items }: { items: PricingItem[] }) {
  return (
    <section>
      <SectionHeader
        title="报价档位 · Pricing"
        subtitle="首页第 5 区，3 档报价，最多 1 档「精选」"
        count={items.length}
      />
      <NewPricingForm />
      <div className="mt-3 space-y-3">
        {items.length === 0 ? (
          <Empty />
        ) : (
          items.map((it, i) => (
            <PricingRow key={it.id} item={it} isFirst={i === 0} isLast={i === items.length - 1} />
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

function NewPricingForm() {
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [bullets, setBullets] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setLabel("");
    setPrice("");
    setDesc("");
    setBullets([]);
    setFeatured(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !price.trim() || !desc.trim() || bullets.length === 0) {
      toast.error("所有字段必填，且 bullets 至少 1 条");
      return;
    }
    startTransition(async () => {
      try {
        await createLandingBlock({
          kind: "pricing",
          data: {
            label: label.trim(),
            price: price.trim(),
            desc: desc.trim(),
            bullets,
            featured,
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
      <h3 className="font-serif text-[14px] tracking-tight text-ink">新增报价档位</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="档位名">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={40}
            placeholder="标准版"
            className="w-full rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
          />
        </Field>
        <Field label="价格区间">
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            maxLength={60}
            placeholder="¥8,000 — ¥20,000"
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
      <Field label="包含项（每行一条）" hint={`已有 ${bullets.length} 条`}>
        <BulletsEditor value={bullets} onChange={setBullets} />
      </Field>
      <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink">
        <input
          type="checkbox"
          checked={featured}
          onChange={(e) => setFeatured(e.target.checked)}
          className="h-4 w-4 rounded border-hairline accent-ink"
        />
        <span>精选档（首页突出显示）</span>
      </label>
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

function PricingRow({
  item,
  isFirst,
  isLast,
}: {
  item: PricingItem;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(item.data.label);
  const [price, setPrice] = useState(item.data.price);
  const [desc, setDesc] = useState(item.data.desc);
  const [bullets, setBullets] = useState<string[]>(item.data.bullets);
  const [featured, setFeatured] = useState(item.data.featured);
  const [pending, startTransition] = useTransition();

  const onSave = () => {
    if (!label.trim() || !price.trim() || !desc.trim() || bullets.length === 0) {
      toast.error("所有字段必填，且 bullets 至少 1 条");
      return;
    }
    startTransition(async () => {
      try {
        await updateLandingBlock({
          id: item.id,
          kind: "pricing",
          data: {
            label: label.trim(),
            price: price.trim(),
            desc: desc.trim(),
            bullets,
            featured,
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
    setLabel(item.data.label);
    setPrice(item.data.price);
    setDesc(item.data.desc);
    setBullets(item.data.bullets);
    setFeatured(item.data.featured);
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
          kind: "pricing",
          published: !item.published,
        });
        toast.success(item.published ? "已设为未发布" : "已发布");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "切换失败");
      }
    });

  const onDelete = () => {
    if (!confirm(`确定删除「${item.data.label}」？此操作不可撤销。`)) return;
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="档位名">
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={40}
                className="w-full rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
              />
            </Field>
            <Field label="价格区间">
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                maxLength={60}
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
          <Field label="包含项（每行一条）">
            <BulletsEditor value={bullets} onChange={setBullets} />
          </Field>
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-hairline accent-ink"
            />
            <span>精选档</span>
          </label>
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
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-3">
                <h3 className="font-medium text-[14px] text-ink">{item.data.label}</h3>
                <span className="font-bold text-[16px] text-ink tracking-tight">
                  {item.data.price}
                </span>
                {item.data.featured && (
                  <span className="rounded-full bg-ok-bg/60 px-2 py-0.5 text-[10px] text-ok">
                    精选
                  </span>
                )}
                {!item.published && (
                  <span className="rounded-full border border-hairline bg-paper-soft/70 px-2 py-0.5 text-[10px] text-mute">
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
