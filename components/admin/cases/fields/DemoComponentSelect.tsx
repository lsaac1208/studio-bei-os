"use client";

import { CASE_DEMO_KEYS, CASE_DEMO_LABELS, type CaseDemoKey } from "@/lib/case-options";

interface Props {
  value: CaseDemoKey | null;
  onChange: (next: CaseDemoKey | null) => void;
}

export function DemoComponentSelect({ value, onChange }: Props) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === "" ? null : (v as CaseDemoKey));
      }}
      className="w-full rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[13px] outline-none transition focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
    >
      <option value="">— 不挂接交互演示 —</option>
      {CASE_DEMO_KEYS.map((k) => (
        <option key={k} value={k}>
          {CASE_DEMO_LABELS[k]}
        </option>
      ))}
    </select>
  );
}
