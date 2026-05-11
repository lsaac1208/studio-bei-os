"use client";

import { MiniButton, StatusTag } from "@/components/cases/primitives";
import type { Lead } from "@/lib/case/hengyue";
import { cn } from "@/lib/utils";

type Props = {
  leads: Lead[];
  onFollow: (id: string) => void;
  onMarkHot: (id: string) => void;
  onClose: (id: string) => void;
  onDelete: (id: string) => void;
};

type ColKey = "new" | "following" | "hot" | "closed";

const COLUMNS: Array<{ key: ColKey; label: string; desc: string }> = [
  { key: "new", label: "新询盘", desc: "1 个工作日内联系" },
  { key: "following", label: "跟进中", desc: "保持每周一次沟通" },
  { key: "hot", label: "高意向", desc: "需要工程师介入" },
  { key: "closed", label: "已成交", desc: "签合同 · 安排排产" },
];

const filterLeads = (leads: Lead[], key: ColKey): Lead[] => {
  if (key === "hot") return leads.filter((l) => l.level === "hot" && l.stage !== "closed");
  if (key === "closed") return leads.filter((l) => l.stage === "closed");
  return leads.filter((l) => l.stage === key && l.level !== "hot");
};

export function LeadBoard({ leads, onFollow, onMarkHot, onClose, onDelete }: Props) {
  return (
    <section aria-label="销售端 — 询盘看板">
      <div className="mb-4 flex items-center gap-2.5 text-[11px] text-mute uppercase tracking-[0.14em]">
        <span className="h-2 w-2 flex-none rounded-full bg-ink" />
        <strong className="font-bold text-ink tracking-[0.16em]">B 端</strong>
        <small className="font-normal normal-case text-mute tracking-normal">
          销售在飞书 / 后台看到的看板
        </small>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {COLUMNS.map((col) => {
          const items = filterLeads(leads, col.key);
          return (
            <div
              key={col.key}
              className="min-h-[200px] rounded-2xl border border-hairline bg-white/60 p-4.5"
            >
              <div className="mb-3.5 flex items-baseline justify-between border-hairline border-b border-dashed pb-2.5">
                <strong className="font-bold text-[13px]">{col.label}</strong>
                <small className="font-mono text-[11px] text-mute">
                  {items.length} · {col.desc}
                </small>
              </div>

              {items.length === 0 ? (
                <div className="rounded-xl border border-hairline-strong border-dashed p-5 text-center text-[12px] text-mute">
                  空闲 · 暂无线索
                </div>
              ) : (
                <div className="grid gap-2.5">
                  {items.map((lead) => (
                    <article
                      key={lead.id}
                      className={cn(
                        "grid gap-2 rounded-xl border bg-white p-3.5 transition-all",
                        lead.level === "hot"
                          ? "border-indus-2/40 bg-gradient-to-b from-[#fff7f3] to-white"
                          : "border-hairline",
                      )}
                    >
                      {lead.level === "hot" && (
                        <span className="inline-block w-fit rounded font-mono font-bold text-[9px] text-white tracking-[0.1em] bg-indus-2 px-1.5 py-0.5">
                          HOT
                        </span>
                      )}

                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-bold text-sm tracking-tight">
                          {lead.company}
                          <small className="ml-1.5 font-normal text-[11px] text-mute">
                            {lead.name}
                          </small>
                        </span>
                        <StatusTag status={lead.level} />
                      </div>

                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        <span className="rounded-full bg-paper-soft px-2 py-0.5 font-mono text-ink tracking-wide">
                          预算 {lead.budget}
                        </span>
                        <span className="rounded-full bg-paper-soft px-2 py-0.5 font-mono text-ink tracking-wide">
                          {lead.volume}
                        </span>
                        <span className="rounded-full bg-paper-soft px-2 py-0.5 font-mono text-ink tracking-wide">
                          {lead.source}
                        </span>
                      </div>

                      <p className="border-hairline border-l-2 pl-2.5 text-[12px] text-ink-soft leading-relaxed">
                        {lead.message}
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {col.key === "new" && (
                          <MiniButton variant="primary" onClick={() => onFollow(lead.id)}>
                            开始跟进
                          </MiniButton>
                        )}
                        {col.key === "following" && (
                          <>
                            <MiniButton variant="primary" onClick={() => onMarkHot(lead.id)}>
                              标为高意向
                            </MiniButton>
                            <MiniButton onClick={() => onClose(lead.id)}>成交</MiniButton>
                          </>
                        )}
                        {col.key === "hot" && (
                          <MiniButton variant="primary" onClick={() => onClose(lead.id)}>
                            成交
                          </MiniButton>
                        )}
                        <MiniButton onClick={() => onDelete(lead.id)}>删除</MiniButton>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
