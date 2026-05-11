"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { BUSINESS_TYPE_OPTIONS, LEAD_STATUS_OPTIONS } from "@/lib/lead-options";
import { cn } from "@/lib/utils";

/**
 * 列表页筛选条 —— 用 URL search params 做 single source of truth。
 * 改 status / businessType 立即跳转；q 关键词 350ms 防抖后跳。
 */
export function LeadsToolbar({ totalLabel }: { totalLabel: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const status = sp.get("status") ?? "";
  const businessType = sp.get("businessType") ?? "";
  const initialQ = sp.get("q") ?? "";

  const [q, setQ] = useState(initialQ);
  const [, startTransition] = useTransition();

  // sp 变化时同步本地 q（如点重置后）
  useEffect(() => {
    setQ(initialQ);
  }, [initialQ]);

  // q 防抖
  useEffect(() => {
    if (q === initialQ) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(sp);
      if (q.trim()) next.set("q", q.trim());
      else next.delete("q");
      next.delete("page");
      startTransition(() => router.replace(`${pathname}?${next.toString()}`));
    }, 350);
    return () => clearTimeout(t);
  }, [q, initialQ, sp, pathname, router]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(sp);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    startTransition(() => router.replace(`${pathname}?${next.toString()}`));
  };

  const reset = () => {
    setQ("");
    startTransition(() => router.replace(pathname));
  };

  const hasFilter = Boolean(status || businessType || q);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* 状态 chip */}
        <ChipGroup
          label="状态"
          value={status}
          onChange={(v) => updateParam("status", v)}
          options={[
            { value: "", label: "全部" },
            ...LEAD_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
          ]}
        />

        <span className="mx-1 hidden h-5 w-px bg-hairline md:inline" />

        {/* 业务类型 chip */}
        <ChipGroup
          label="方向"
          value={businessType}
          onChange={(v) => updateParam("businessType", v)}
          options={[
            { value: "", label: "全部" },
            ...BUSINESS_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索编号 / 客户名 / 微信 / 手机 / 邮箱 / 描述…"
            className="w-full max-w-xs rounded-xl border border-hairline bg-white/70 px-3 py-1.5 text-[13px] outline-none transition placeholder:text-mute-soft focus:border-ink/40 focus:bg-white focus:ring-2 focus:ring-ink/8 sm:w-72"
          />
          {hasFilter && (
            <button
              type="button"
              onClick={reset}
              className="shrink-0 text-[12px] text-mute hover:text-ink"
            >
              重置筛选
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <a
            href={buildExportHref(sp)}
            className="shrink-0 rounded-full border border-hairline bg-white/60 px-3 py-1 text-[12px] text-mute transition hover:border-hairline-strong hover:text-ink"
            title="按当前筛选导出 CSV（最多 5000 条）"
          >
            导出 CSV
          </a>
          <span className="text-[12px] text-mute tabular-nums">{totalLabel}</span>
        </div>
      </div>
    </div>
  );
}

/** 复用当前筛选 query string，构造 /api/admin/leads/export?... 链接 */
function buildExportHref(sp: ReturnType<typeof useSearchParams>): string {
  const next = new URLSearchParams();
  for (const key of ["status", "businessType", "q"] as const) {
    const v = sp.get(key);
    if (v) next.set(key, v);
  }
  const qs = next.toString();
  return qs ? `/api/admin/leads/export?${qs}` : "/api/admin/leads/export";
}

function ChipGroup<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] text-mute-soft uppercase tracking-wider">{label}</span>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value || "ALL"}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[12px] transition",
              active
                ? "border-ink bg-ink text-paper"
                : "border-hairline bg-white/60 text-mute hover:border-hairline-strong hover:text-ink",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
