"use client";

import { MiniButton, StatusTag } from "@/components/cases/primitives";
import { addDays, formatDate, formatDateShort } from "@/lib/case/format";
import { type Appointment, SERVICES } from "@/lib/case/qiguang";
import { cn } from "@/lib/utils";

type Props = {
  appointments: Appointment[];
  onConfirm: (id: string) => void;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
};

const TICKS = ["9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"];

const blockBg: Record<Appointment["status"], string> = {
  pending: "bg-studio-1/20 border-studio-1/40 text-studio-ink",
  confirmed: "bg-[rgba(47,122,74,0.18)] border-[rgba(47,122,74,0.4)] text-[#1e4a2c]",
  completed: "bg-white/70 border-hairline text-mute opacity-65",
  cancelled: "bg-bad/15 border-bad/30 text-bad opacity-70 line-through",
};

export function Dashboard({ appointments, onConfirm, onComplete, onCancel, onDelete }: Props) {
  const todayKey = addDays(0);
  const todayList = appointments
    .filter((a) => a.date === todayKey)
    .sort((a, b) => a.time.localeCompare(b.time));
  const todayActive = todayList.filter((a) => a.status !== "cancelled");
  const confirmed = todayList.filter(
    (a) => a.status === "confirmed" || a.status === "completed",
  ).length;
  const total = todayActive.length;
  const fillPct = total ? Math.round((confirmed / total) * 100) : 0;

  const sorted = [...appointments].sort((a, b) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
  );

  return (
    <section aria-label="商家端 — 后台排期">
      {/* pane tag */}
      <div className="mb-4 flex items-center gap-2.5 text-[11px] text-mute uppercase tracking-[0.14em]">
        <span className="h-2 w-2 flex-none rounded-full bg-ink" />
        <strong className="font-bold text-ink tracking-[0.16em]">B 端</strong>
        <small className="font-normal normal-case text-mute tracking-normal">
          主理人在 PC 后台看到的界面
        </small>
      </div>

      <div className="grid gap-4">
        {/* top bar */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-7 rounded-2xl border border-hairline bg-white/70 px-5.5 py-4.5">
          <div>
            <small className="block font-semibold text-[10px] text-mute uppercase tracking-[0.14em]">
              今天
            </small>
            <strong className="mt-1 block font-bold text-lg tabular-nums tracking-tight">
              {formatDate(todayKey)}
            </strong>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-paper-deep">
            <span
              className="block h-full rounded-inherit bg-gradient-to-r from-studio-1 to-ok transition-[width] duration-700"
              style={{ width: `${fillPct}%` }}
            />
          </div>
          <div>
            <small className="block font-semibold text-[10px] text-mute uppercase tracking-[0.14em]">
              已确认 / 全部
            </small>
            <strong className="mt-1 block font-bold text-lg tabular-nums tracking-tight">
              {confirmed} · {total}
            </strong>
          </div>
        </div>

        {/* schedule */}
        <div className="rounded-2xl border border-hairline bg-white/70 p-5.5">
          <div className="mb-4.5 flex items-baseline justify-between">
            <strong className="font-bold text-[13px]">当日时间轴</strong>
            <small className="font-mono text-[11px] text-mute">09:00 — 20:00</small>
          </div>
          <div className="relative grid h-20 grid-cols-11 gap-0 border-hairline border-y">
            {/* tick marks */}
            {TICKS.map((t) => (
              <div
                key={t}
                className="border-hairline border-l pt-1.5 pl-1 font-mono text-[9px] text-mute first:border-l-0"
              >
                {t}
              </div>
            ))}
            {/* blocks */}
            {todayList.map((a) => {
              const [h, m] = a.time.split(":").map(Number);
              const hours = h + m / 60 - 9;
              const left = Math.max(0, Math.min(100, (hours / 11) * 100));
              const duration = SERVICES.find((s) => s.name === a.service)?.duration ?? 90;
              const widthPct = Math.min(100 - left, (duration / 60 / 11) * 100);
              return (
                <div
                  key={a.id}
                  title={`${a.customer} · ${a.service}`}
                  className={cn(
                    "absolute top-5.5 bottom-2 cursor-pointer overflow-hidden rounded-lg border px-2.5 py-2 text-[11px] leading-tight transition-transform hover:-translate-y-0.5",
                    blockBg[a.status],
                  )}
                  style={{ left: `${left}%`, width: `${widthPct}%` }}
                >
                  <strong className="block truncate font-bold text-[11px]">{a.customer}</strong>
                  <small className="block font-mono text-[10px] opacity-70">
                    {a.time} · {a.service}
                  </small>
                </div>
              );
            })}
          </div>
        </div>

        {/* table */}
        <div className="overflow-hidden rounded-2xl border border-hairline bg-white/70">
          {sorted.length === 0 ? (
            <div className="p-6 text-center text-[13px] text-mute">
              暂无预约 · 试着提交一条客户预约
            </div>
          ) : (
            sorted.map((a) => (
              <div
                key={a.id}
                className="grid grid-cols-[80px_1fr_auto] items-center gap-3.5 border-hairline border-b px-5 py-3.5 text-[13px] last:border-b-0 lg:grid-cols-[90px_1fr_90px_auto]"
              >
                <div className="grid gap-0.5">
                  <strong className="font-mono font-bold text-[13px] tabular-nums">{a.time}</strong>
                  <small className="font-mono text-[10px] text-mute tracking-wide">
                    {formatDateShort(a.date)}
                  </small>
                </div>
                <div>
                  <strong className="block font-bold text-[13px]">
                    {a.customer} · {a.service}
                  </strong>
                  <small className="mt-0.5 block text-[11px] text-mute">
                    {a.phone} · {a.note || "无备注"}
                  </small>
                </div>
                <div className="hidden lg:block">
                  <StatusTag status={a.status} />
                </div>
                <div className="col-span-3 flex flex-wrap justify-end gap-1.5 lg:col-span-1">
                  <span className="lg:hidden">
                    <StatusTag status={a.status} />
                  </span>
                  {a.status === "pending" && (
                    <>
                      <MiniButton variant="primary" onClick={() => onConfirm(a.id)}>
                        确认
                      </MiniButton>
                      <MiniButton variant="danger" onClick={() => onCancel(a.id)}>
                        取消
                      </MiniButton>
                    </>
                  )}
                  {a.status === "confirmed" && (
                    <>
                      <MiniButton variant="primary" onClick={() => onComplete(a.id)}>
                        完成
                      </MiniButton>
                      <MiniButton variant="danger" onClick={() => onCancel(a.id)}>
                        取消
                      </MiniButton>
                    </>
                  )}
                  <MiniButton onClick={() => onDelete(a.id)}>删除</MiniButton>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
