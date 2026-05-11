"use client";

import type { ClientQuoteInput } from "@/lib/validators";

interface Props {
  value: ClientQuoteInput | null;
  onChange: (next: ClientQuoteInput | null) => void;
}

const EMPTY: ClientQuoteInput = { text: "", authorName: "", authorTitle: "" };

export function ClientQuoteFields({ value, onChange }: Props) {
  const enabled = value !== null;
  const v = value ?? EMPTY;

  const update = (patch: Partial<ClientQuoteInput>) => {
    onChange({ ...v, ...patch });
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-[13px] text-ink">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked ? { ...EMPTY } : null)}
          className="h-3.5 w-3.5 rounded border-hairline accent-ink"
        />
        启用客户证言
      </label>

      {enabled && (
        <div className="space-y-2 rounded-lg border border-hairline bg-white/60 p-3">
          <textarea
            value={v.text}
            onChange={(e) => update({ text: e.target.value })}
            placeholder="客户原话，例如：上线后我们前台再没接错过单了。"
            rows={3}
            maxLength={600}
            className="w-full resize-y rounded border border-hairline bg-white/70 px-2 py-1.5 text-[13px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
          />
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={v.authorName}
              onChange={(e) => update({ authorName: e.target.value })}
              placeholder="作者姓名（如 张总）"
              maxLength={120}
              className="min-w-0 flex-1 rounded border border-hairline bg-white/70 px-2 py-1 text-[12px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
            />
            <input
              type="text"
              value={v.authorTitle ?? ""}
              onChange={(e) => update({ authorTitle: e.target.value })}
              placeholder="头衔（如 栖光摄影 创始人）"
              maxLength={120}
              className="min-w-0 flex-1 rounded border border-hairline bg-white/70 px-2 py-1 text-[12px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
            />
          </div>
        </div>
      )}
    </div>
  );
}
