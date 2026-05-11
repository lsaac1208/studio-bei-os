"use client";

import { useState } from "react";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  max?: number;
  maxItemLength?: number;
}

/**
 * 用于 tags / techStack 等字符串数组：
 * - 输入回车 / 逗号 / 中文逗号 → 添加
 * - 点击 chip × 删除
 * - 退格在空输入时删最后一项
 */
export function TagsInput({
  value,
  onChange,
  placeholder = "回车添加",
  max = 12,
  maxItemLength = 40,
}: Props) {
  const [draft, setDraft] = useState("");

  const addOne = (raw: string) => {
    const v = raw.trim().slice(0, maxItemLength);
    if (!v) return;
    if (value.includes(v)) return;
    if (value.length >= max) return;
    onChange([...value, v]);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === "，") {
      e.preventDefault();
      addOne(draft);
      setDraft("");
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeAt = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-hairline bg-white/70 px-2 py-1.5 transition focus-within:border-ink/40 focus-within:ring-2 focus-within:ring-ink/8">
      {value.map((tag, idx) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: 同名重复已被去重，本地数组用 idx 安全
          key={idx}
          className="inline-flex items-center gap-1 rounded-full bg-ink/8 px-2.5 py-0.5 text-[12px] text-ink"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeAt(idx)}
            className="text-mute transition hover:text-bad"
            aria-label={`删除 ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => {
          if (draft.trim()) {
            addOne(draft);
            setDraft("");
          }
        }}
        placeholder={value.length === 0 ? placeholder : ""}
        maxLength={maxItemLength}
        className="min-w-[100px] flex-1 bg-transparent px-1 py-0.5 text-[13px] outline-none placeholder:text-mute-soft"
      />
    </div>
  );
}
