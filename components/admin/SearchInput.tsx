"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * 搜索输入框 — 同时用于：
 *  1. 后台顶栏（compact=true，窄一点）
 *  2. 搜索结果页（compact=false，大输入框 + autoFocus）
 *
 * 行为：
 *  - 回车跳 /admin/search?q=...
 *  - Cmd+K / Ctrl+K：聚焦本框（如果已存在多个，仅第一个响应）
 *  - 显示 ⌘K 提示（compact 模式才显示）
 */
interface Props {
  defaultValue?: string;
  compact?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
}

export function SearchInput({
  defaultValue = "",
  compact = false,
  autoFocus = false,
  placeholder = "搜线索 / 案例 / FAQ / 内容…",
}: Props) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  // Cmd+K / Ctrl+K 聚焦
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
        ref.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // autoFocus prop：手动 focus 以避免 a11y/noAutofocus 误报
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) {
      router.push("/admin/search");
      return;
    }
    router.push(`/admin/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <search className={compact ? "relative block" : "relative block max-w-2xl"}>
      <form onSubmit={onSubmit}>
        <input
          ref={ref}
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          aria-label="搜索"
          className={
            compact
              ? "w-44 rounded-full border border-hairline bg-white/60 py-1 pr-12 pl-3 text-[12px] outline-none transition focus:w-64 focus:border-ink/40 focus:ring-2 focus:ring-ink/8 sm:w-56"
              : "w-full rounded-2xl border border-hairline bg-white/60 px-5 py-3 text-[15px] outline-none transition focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
          }
        />
        {compact && (
          <kbd className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-2 hidden rounded border border-hairline bg-white/80 px-1.5 py-0.5 font-mono text-[9px] text-mute-soft sm:inline-block">
            ⌘K
          </kbd>
        )}
      </form>
    </search>
  );
}
