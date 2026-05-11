"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { addDays, uid } from "@/lib/case/format";
import {
  type Appointment,
  type AppointmentStatus,
  createDefaultAppointments,
} from "@/lib/case/qiguang";
import { Dashboard } from "./Dashboard";
import { Phone, type PhoneSubmitData } from "./Phone";

const STORAGE_KEY = "studio-bei-qiguang-v1";

export function CaseQiguang() {
  const [appointments, setAppointments] = useState<Appointment[]>(createDefaultAppointments);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on first client render
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setAppointments(JSON.parse(stored));
    } catch {
      // 忽略损坏数据，沿用 seed
    }
    setHydrated(true);
  }, []);

  // Persist on every change (skip first render to avoid overwriting saved state with seed)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
    } catch {
      // 忽略 quota / safari 私密模式
    }
  }, [appointments, hydrated]);

  const addAppointment = (data: PhoneSubmitData) => {
    const fresh: Appointment = {
      ...data,
      customer: data.customer.trim(),
      phone: data.phone.trim(),
      note: data.note.trim(),
      id: uid("A"),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setAppointments((prev) => [fresh, ...prev]);
    toast("预约已提交 · 商家后台收到通知");
  };

  const setStatus = (id: string, status: AppointmentStatus) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    toast("预约状态已更新");
  };

  const removeAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    toast("预约已删除");
  };

  // stats（客户端计算，避免 hydration mismatch）
  const todayKey = addDays(0);
  const total = appointments.length;
  const todayList = appointments.filter((a) => a.date === todayKey && a.status !== "cancelled");
  const pending = appointments.filter((a) => a.status === "pending").length;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const confirmedToday = todayList.filter(
    (a) => a.status === "confirmed" || a.status === "completed",
  ).length;

  return (
    <article
      id="case-01"
      data-case="01"
      className="relative overflow-hidden border-hairline border-t bg-studio-bg px-5 py-16 sm:px-8 lg:px-14 lg:py-28"
    >
      <span className="absolute top-6 right-5 font-mono text-[11px] text-mute uppercase tracking-[0.16em] sm:right-8 lg:right-14">
        Case 01
      </span>

      {/* case header */}
      <header className="mx-auto mb-14 grid max-w-[1280px] items-end gap-10 lg:grid-cols-[2fr_1fr] lg:gap-14">
        <div>
          <div className="mb-5.5 flex flex-wrap items-center gap-3.5">
            <span className="font-mono text-[11px] text-mute uppercase tracking-[0.16em]">
              Case / 01
            </span>
            <span className="rounded-full border border-hairline-strong px-3 py-1 font-semibold text-[11px] text-ink uppercase tracking-[0.14em]">
              本地服务 · 摄影工作室
            </span>
          </div>
          <h2 className="mb-5.5 font-bold text-[clamp(40px,6vw,80px)] text-ink leading-none tracking-[-0.04em]">
            栖光摄影
            <small className="mt-3 block font-serif font-normal text-sm text-mute italic tracking-wider">
              Qiguang Studio
            </small>
          </h2>
          <p className="mb-5.5 max-w-[640px] text-[16px] text-ink-soft leading-[1.75]">
            一家两位摄影师的城市写真工作室。原来用微信接单，时常漏消息、撞档、忘记回复客户。
            我做了一套
            <strong className="rounded-sm bg-white/65 px-1 font-bold text-ink">
              客户端在线预约 + 商家后台排期
            </strong>
            的小程序方案，这里展示其中的网页版交互逻辑。
          </p>
          <ul className="grid gap-2 text-[14px] leading-snug">
            {[
              "客户端选择服务、日期和时间段，留下手机号即可下单",
              "商家端当日时间轴排期、确认 / 改期 / 完成 / 取消",
              "统计每日预约、待确认、已完成与转化漏斗",
            ].map((b) => (
              <li
                key={b}
                className="flex items-start gap-3.5 text-ink-soft before:mt-2.5 before:h-px before:w-4.5 before:flex-none before:bg-ink before:content-['']"
              >
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* stats */}
        <aside className="grid gap-3 self-end">
          <StatCard
            label="今日到店"
            value={todayList.length}
            meta={`已确认 ${confirmedToday} / 待确认 ${todayList.length - confirmedToday}`}
          />
          <StatCard label="累计预约" value={total} meta={`完成 ${completed} 单 · 客户复购可追踪`} />
          <StatCard label="待客服处理" value={pending} meta="提交后自动进入待确认列表" />
        </aside>
      </header>

      {/* stage */}
      <div className="mx-auto grid max-w-[1280px] items-start gap-8 lg:grid-cols-[380px_1fr]">
        <Phone onSubmit={addAppointment} />
        <Dashboard
          appointments={appointments}
          onConfirm={(id) => setStatus(id, "confirmed")}
          onComplete={(id) => setStatus(id, "completed")}
          onCancel={(id) => setStatus(id, "cancelled")}
          onDelete={removeAppointment}
        />
      </div>

      {/* footer link */}
      <div className="mx-auto mt-10 max-w-[1280px] text-right">
        <Link
          href="/cases/qiguang-studio"
          className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-white/60 px-4 py-2 text-[13px] text-ink transition hover:border-hairline-strong hover:bg-white/90"
        >
          查看完整案例 <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

function StatCard({ label, value, meta }: { label: string; value: number | string; meta: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-white/50 px-5 py-4.5 backdrop-blur-sm">
      <small className="block font-semibold text-[10px] text-mute uppercase tracking-[0.14em]">
        {label}
      </small>
      <strong className="mt-2 block font-bold text-4xl tabular-nums tracking-[-0.04em]">
        {value}
      </strong>
      <span className="mt-1.5 block text-[12px] text-mute">{meta}</span>
    </div>
  );
}
