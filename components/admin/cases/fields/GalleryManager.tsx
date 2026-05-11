"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { useImageUpload } from "@/components/admin/upload/useImageUpload";
import type { CaseGalleryItemInput } from "@/lib/validators";

interface Props {
  value: CaseGalleryItemInput[];
  onChange: (next: CaseGalleryItemInput[]) => void;
  slug?: string;
  max?: number;
}

export function GalleryManager({ value, onChange, slug, max = 24 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { busy, upload } = useImageUpload();

  const onPick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    if (value.length + files.length > max) {
      toast.error(`最多 ${max} 张图`);
      return;
    }
    const added: CaseGalleryItemInput[] = [];
    for (const f of files) {
      try {
        const r = await upload(f, { namespace: "cases-gallery", slug });
        added.push({ url: r.url, alt: f.name.replace(/\.[^.]+$/, ""), caption: "" });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `上传 ${f.name} 失败`);
      }
    }
    if (added.length > 0) {
      onChange([...value, ...added]);
      toast.success(`新增 ${added.length} 张`);
    }
  };

  const updateItem = (idx: number, patch: Partial<CaseGalleryItemInput>) => {
    const next = value.slice();
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const removeItem = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const moveItem = (idx: number, direction: "up" | "down") => {
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= value.length) return;
    const next = value.slice();
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onPick}
          disabled={busy || value.length >= max}
          className="rounded-md border border-hairline bg-white/60 px-3 py-1.5 text-[12px] text-mute transition hover:border-hairline-strong hover:text-ink disabled:opacity-50"
        >
          {busy ? "上传中…" : "+ 添加图片"}
        </button>
        <span className="text-[11px] text-mute-soft">
          {value.length} / {max}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onFile}
        className="hidden"
      />

      {value.length === 0 ? (
        <p className="rounded-lg border border-hairline border-dashed bg-white/40 px-4 py-6 text-center text-[12px] text-mute-soft">
          还没有图集，添加一些项目截图 / 实景图让案例更直观
        </p>
      ) : (
        <ul className="space-y-2">
          {value.map((item, idx) => (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: 本地数组，可能同图重传 URL 重复，用 idx 安全
              key={idx}
              className="flex flex-wrap items-start gap-3 rounded-lg border border-hairline bg-white/60 p-3 sm:flex-nowrap"
            >
              <div className="h-20 w-32 shrink-0 overflow-hidden rounded border border-hairline bg-paper-soft">
                {/* biome-ignore lint/performance/noImgElement: 后台预览 */}
                <img src={item.url} alt={item.alt} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <input
                  type="text"
                  value={item.alt}
                  onChange={(e) => updateItem(idx, { alt: e.target.value })}
                  placeholder="alt（无障碍描述，必填）"
                  maxLength={200}
                  className="w-full rounded border border-hairline bg-white/70 px-2 py-1 text-[12px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
                />
                <input
                  type="text"
                  value={item.caption ?? ""}
                  onChange={(e) => updateItem(idx, { caption: e.target.value })}
                  placeholder="caption（图片说明文字，可选）"
                  maxLength={300}
                  className="w-full rounded border border-hairline bg-white/70 px-2 py-1 text-[12px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
                />
              </div>
              <div className="flex shrink-0 items-center gap-1 self-start">
                <button
                  type="button"
                  onClick={() => moveItem(idx, "up")}
                  disabled={idx === 0}
                  className="rounded border border-hairline px-2 py-0.5 text-[11px] text-mute transition hover:border-hairline-strong hover:text-ink disabled:opacity-30"
                  aria-label="上移"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(idx, "down")}
                  disabled={idx === value.length - 1}
                  className="rounded border border-hairline px-2 py-0.5 text-[11px] text-mute transition hover:border-hairline-strong hover:text-ink disabled:opacity-30"
                  aria-label="下移"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="rounded border border-hairline px-2 py-0.5 text-[11px] text-mute transition hover:border-bad/50 hover:text-bad"
                  aria-label="删除"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
