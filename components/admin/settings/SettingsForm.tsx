"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateSettings } from "@/actions/settings";
import type { SettingFieldMeta } from "@/lib/settings-keys";

interface Props {
  title: string;
  description?: string;
  fields: SettingFieldMeta[];
  initial: Record<string, string>;
}

export function SettingsForm({ title, description, fields, initial }: Props) {
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [pending, startTransition] = useTransition();

  const dirty = fields.some((f) => (values[f.key] ?? "") !== (initial[f.key] ?? ""));

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dirty) return;
    startTransition(async () => {
      try {
        const payload: Record<string, string> = {};
        for (const f of fields) payload[f.key] = values[f.key] ?? "";
        const res = await updateSettings(payload);
        toast.success(
          `已保存（更新 ${res.updated} 项${res.cleared ? `，清空 ${res.cleared} 项` : ""}）`,
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "保存失败");
      }
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-2xl border border-hairline bg-white/60 p-6"
    >
      <div>
        <h2 className="font-serif text-lg tracking-tight text-ink">{title}</h2>
        {description && <p className="mt-1 text-[12px] text-mute">{description}</p>}
      </div>

      <div className="space-y-4">
        {fields.map((f) => {
          const val = values[f.key] ?? "";
          const changed = (initial[f.key] ?? "") !== val;
          return (
            <div key={f.key}>
              <div className="mb-1 flex items-baseline justify-between">
                <label htmlFor={f.key} className="text-[12px] text-ink">
                  {f.label}
                </label>
                <span className="font-mono text-[10px] text-mute-soft">
                  {f.key}
                  {changed && <span className="ml-1.5 text-warn">·未保存</span>}
                </span>
              </div>
              {f.rows && f.rows > 1 ? (
                <textarea
                  id={f.key}
                  value={val}
                  onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  rows={f.rows}
                  maxLength={2000}
                  placeholder={f.placeholder}
                  className="w-full resize-y rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[13px] outline-none transition placeholder:text-mute-soft focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
                />
              ) : (
                <input
                  id={f.key}
                  type={
                    f.type === "email"
                      ? "email"
                      : f.type === "url"
                        ? "url"
                        : f.type === "number"
                          ? "number"
                          : "text"
                  }
                  value={val}
                  onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  maxLength={2000}
                  placeholder={f.placeholder}
                  className="w-full rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[13px] outline-none transition placeholder:text-mute-soft focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
                />
              )}
              {f.hint && <p className="mt-1 text-[11px] text-mute-soft">{f.hint}</p>}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-3 border-hairline border-t pt-4">
        <span className="text-[11px] text-mute-soft">
          {dirty ? "有未保存的修改" : "已全部保存"}
        </span>
        <button
          type="submit"
          disabled={pending || !dirty}
          className="rounded-full bg-ink px-4 py-1.5 text-[12px] text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "保存中…" : "保存更改"}
        </button>
      </div>
    </form>
  );
}
