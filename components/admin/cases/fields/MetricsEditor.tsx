"use client";

import type { CaseMetricInput } from "@/lib/validators";

interface Props {
  value: CaseMetricInput[];
  onChange: (next: CaseMetricInput[]) => void;
  max?: number;
}

export function MetricsEditor({ value, onChange, max = 8 }: Props) {
  const addOne = () => {
    if (value.length >= max) return;
    onChange([...value, { label: "", value: "", note: "" }]);
  };

  const updateAt = (idx: number, patch: Partial<CaseMetricInput>) => {
    const next = value.slice();
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const removeAt = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const moveAt = (idx: number, direction: "up" | "down") => {
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= value.length) return;
    const next = value.slice();
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={addOne}
          disabled={value.length >= max}
          className="rounded-md border border-hairline bg-white/60 px-3 py-1 text-[12px] text-mute transition hover:border-hairline-strong hover:text-ink disabled:opacity-50"
        >
          + 添加指标
        </button>
        <span className="text-[11px] text-mute-soft">
          {value.length} / {max}
        </span>
      </div>

      {value.length === 0 ? (
        <p className="rounded-lg border border-hairline border-dashed bg-white/40 px-4 py-4 text-center text-[12px] text-mute-soft">
          暂无指标。例如「排期冲突 / -90% / vs 上线前」
        </p>
      ) : (
        <ul className="space-y-2">
          {value.map((m, idx) => (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: 列表项纯本地
              key={idx}
              className="flex flex-wrap items-start gap-2 rounded-lg border border-hairline bg-white/60 p-2 sm:flex-nowrap"
            >
              <input
                type="text"
                value={m.label}
                onChange={(e) => updateAt(idx, { label: e.target.value })}
                placeholder="指标名（如 排期冲突）"
                maxLength={60}
                className="min-w-0 flex-1 rounded border border-hairline bg-white/70 px-2 py-1 text-[12px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
              />
              <input
                type="text"
                value={m.value}
                onChange={(e) => updateAt(idx, { value: e.target.value })}
                placeholder="数值（如 -90%）"
                maxLength={40}
                className="w-32 shrink-0 rounded border border-hairline bg-white/70 px-2 py-1 text-[12px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
              />
              <input
                type="text"
                value={m.note ?? ""}
                onChange={(e) => updateAt(idx, { note: e.target.value })}
                placeholder="备注（可选）"
                maxLength={60}
                className="min-w-0 flex-1 rounded border border-hairline bg-white/70 px-2 py-1 text-[12px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
              />
              <div className="flex shrink-0 items-center gap-1 self-center">
                <button
                  type="button"
                  onClick={() => moveAt(idx, "up")}
                  disabled={idx === 0}
                  className="rounded border border-hairline px-1.5 py-0.5 text-[11px] text-mute transition hover:border-hairline-strong hover:text-ink disabled:opacity-30"
                  aria-label="上移"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveAt(idx, "down")}
                  disabled={idx === value.length - 1}
                  className="rounded border border-hairline px-1.5 py-0.5 text-[11px] text-mute transition hover:border-hairline-strong hover:text-ink disabled:opacity-30"
                  aria-label="下移"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="rounded border border-hairline px-1.5 py-0.5 text-[11px] text-mute transition hover:border-bad/50 hover:text-bad"
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
