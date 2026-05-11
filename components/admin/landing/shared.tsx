"use client";

import { cn } from "@/lib/utils";

/**
 * 共用：分组标题（Services / Pricing / …）。
 */
export function SectionHeader({
  title,
  subtitle,
  count,
}: {
  title: string;
  subtitle?: string;
  count: number;
}) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <div>
        <h2 className="font-serif text-xl tracking-tight text-ink">{title}</h2>
        {subtitle && <p className="mt-1 text-[12px] text-mute-soft">{subtitle}</p>}
      </div>
      <span className="text-[11px] text-mute-soft tabular-nums">{count} 条</span>
    </div>
  );
}

/**
 * 共用：行操作按钮组（上移 / 下移 / 发布 / 编辑 / 删除）。
 */
export function RowActions({
  pending,
  isFirst,
  isLast,
  published,
  onMoveUp,
  onMoveDown,
  onTogglePublish,
  onEdit,
  onDelete,
}: {
  pending: boolean;
  isFirst: boolean;
  isLast: boolean;
  published: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onTogglePublish: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-hairline border-t pt-3 text-[11px] text-mute">
      <button
        type="button"
        onClick={onMoveUp}
        disabled={pending || isFirst}
        className="rounded-md border border-hairline px-2 py-0.5 transition hover:border-hairline-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="上移"
      >
        ↑ 上移
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={pending || isLast}
        className="rounded-md border border-hairline px-2 py-0.5 transition hover:border-hairline-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="下移"
      >
        ↓ 下移
      </button>
      <div className="flex-1" />
      <button
        type="button"
        onClick={onTogglePublish}
        disabled={pending}
        className="rounded-md border border-hairline px-2 py-0.5 transition hover:border-hairline-strong hover:text-ink disabled:opacity-40"
      >
        {published ? "设为未发布" : "发布"}
      </button>
      <button
        type="button"
        onClick={onEdit}
        disabled={pending}
        className="rounded-md border border-hairline px-2 py-0.5 transition hover:border-hairline-strong hover:text-ink"
      >
        编辑
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="rounded-md border border-hairline px-2 py-0.5 transition hover:border-bad/50 hover:text-bad"
      >
        删除
      </button>
    </div>
  );
}

/**
 * 共用：未发布卡片样式。
 */
export function rowCardClass(published: boolean) {
  return cn(
    "rounded-2xl border bg-white/60 p-5",
    published ? "border-hairline" : "border-hairline border-dashed opacity-70",
  );
}

/**
 * 共用：bullets 编辑器 — 多行 textarea，每行一条。
 */
export function BulletsEditor({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string[];
  onChange: (lines: string[]) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value.join("\n")}
      onChange={(e) =>
        onChange(
          e.target.value
            .split("\n")
            .map((s) => s.trim())
            .filter((s) => s.length > 0),
        )
      }
      rows={rows}
      placeholder={placeholder ?? "每行一条"}
      className="w-full resize-y rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[13px] outline-none transition focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
    />
  );
}

/**
 * 共用：标签 + 输入框包裹器。
 *
 * 注意：用 div + span 代替 <label>，因为这里的 children 可能是 textarea / checkbox /
 * 复合 react node，无法保证有单一 control 与 label 关联。Biome 的
 * `noLabelWithoutControl` 在这种通用包装器上会误报。
 */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="mb-1 block text-[11px] text-mute uppercase tracking-wider">{label}</span>
      {children}
      {hint && <p className="mt-1 text-[11px] text-mute-soft">{hint}</p>}
    </div>
  );
}
