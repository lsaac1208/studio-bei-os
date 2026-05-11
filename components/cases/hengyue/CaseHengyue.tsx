"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { STATUS_TEXT, uid } from "@/lib/case/format";
import { computeLevel, createDefaultLeads, type Lead } from "@/lib/case/hengyue";
import { CaseHengyueHeader } from "./CaseHengyueHeader";
import { IndustrialSite, type InquirySubmit } from "./IndustrialSite";
import { LeadBoard } from "./LeadBoard";

const STORAGE_KEY = "studio-bei-hengyue-v1";

export function CaseHengyue() {
  const [leads, setLeads] = useState<Lead[]>(createDefaultLeads);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setLeads(JSON.parse(stored));
    } catch {
      // 忽略损坏数据
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    } catch {
      // 忽略 quota
    }
  }, [leads, hydrated]);

  const addLead = (data: InquirySubmit) => {
    const level = computeLevel(data.budget, data.volume);
    const fresh: Lead = {
      ...data,
      id: uid("L"),
      level,
      stage: "new",
      createdAt: new Date().toISOString(),
    };
    setLeads((prev) => [fresh, ...prev]);
    toast(`询盘已进入 · 自动评级为「${STATUS_TEXT[level]}」`);
  };

  const followLead = (id: string) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage: "following" } : l)));
    toast("线索状态已更新 · 进入跟进");
  };

  const markHot = (id: string) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, level: "hot" } : l)));
    toast("已标为高意向 · 工程师介入");
  };

  const closeLead = (id: string) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage: "closed" } : l)));
    toast("线索已成交 · 安排排产");
  };

  const removeLead = (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    toast("线索已删除");
  };

  const stats = useMemo(() => {
    const total = leads.length;
    const hot = leads.filter((l) => l.level === "hot").length;
    const closed = leads.filter((l) => l.stage === "closed").length;
    const conversion = total ? Math.round((closed / total) * 100) : 0;
    return { total, hot, closed, conversion };
  }, [leads]);

  return (
    <article
      id="case-03"
      data-case="03"
      className="relative overflow-hidden border-hairline border-t bg-paper px-5 py-16 sm:px-8 lg:px-14 lg:py-28"
    >
      <span className="absolute top-6 right-5 font-mono text-[11px] text-mute uppercase tracking-[0.16em] sm:right-8 lg:right-14">
        Case 03
      </span>

      <CaseHengyueHeader stats={stats} />

      {/* stage：industrial-stage 是 1:1 而非 380:1fr */}
      <div className="mx-auto grid max-w-[1280px] items-start gap-8 lg:grid-cols-2">
        <IndustrialSite onSubmit={addLead} />
        <LeadBoard
          leads={leads}
          onFollow={followLead}
          onMarkHot={markHot}
          onClose={closeLead}
          onDelete={removeLead}
        />
      </div>

      {/* footer link */}
      <div className="mx-auto mt-10 max-w-[1280px] text-right">
        <Link
          href="/cases/hengyue-industrial"
          className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-white/60 px-4 py-2 text-[13px] text-ink transition hover:border-hairline-strong hover:bg-white/90"
        >
          查看完整案例 <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
