"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { useImageUpload } from "@/components/admin/upload/useImageUpload";

interface Props {
  value: string;
  onChange: (url: string) => void;
  slug?: string;
}

export function CoverUploader({ value, onChange, slug }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { busy, upload } = useImageUpload();

  const onPick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const r = await upload(file, { namespace: "cases-cover", slug });
      onChange(r.url);
      toast.success("封面已上传");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "上传失败");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <div className="h-32 w-56 shrink-0 overflow-hidden rounded-lg border border-hairline bg-paper-soft">
          {value ? (
            // biome-ignore lint/performance/noImgElement: 后台预览，不需要 next/image
            <img src={value} alt="封面预览" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[11px] text-mute-soft">
              暂无封面
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onPick}
            disabled={busy}
            className="rounded-md border border-hairline bg-white/60 px-3 py-1.5 text-[12px] text-mute transition hover:border-hairline-strong hover:text-ink disabled:opacity-50"
          >
            {busy ? "上传中…" : value ? "更换封面" : "上传封面"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-md border border-hairline bg-white/60 px-3 py-1.5 text-[12px] text-mute transition hover:border-bad/40 hover:text-bad"
            >
              移除封面
            </button>
          )}
          <p className="text-[11px] text-mute-soft">支持 PNG / JPG / WebP，≤ 5MB</p>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
    </div>
  );
}
