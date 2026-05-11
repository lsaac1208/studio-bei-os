import { count, desc, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db/client";
import { leads } from "@/db/schema";
import { LEAD_STATUS_OPTIONS } from "@/lib/lead-options";
import { listPendingTodos } from "@/lib/queries/leads";

/**
 * /admin 后台首页 —— M5 占位 dashboard。
 *
 * M5 阶段先给出最小可用的概览（线索总数 / 各状态数 / 最新 5 条），
 * 完整线索列表 + 看板在 M6 实装。
 */
export default async function AdminDashboardPage() {
  const [{ total }] = await db.select({ total: count() }).from(leads);

  // 按状态分组
  const statusGroups = await db
    .select({
      status: leads.status,
      cnt: count(),
    })
    .from(leads)
    .groupBy(leads.status);
  const statusMap = new Map(statusGroups.map((g) => [g.status, Number(g.cnt)]));

  // 最近 5 条
  const recent = await db
    .select({
      id: leads.id,
      code: leads.code,
      name: leads.name,
      businessType: leads.businessType,
      status: leads.status,
      createdAt: leads.createdAt,
    })
    .from(leads)
    .orderBy(desc(leads.createdAt))
    .limit(5);

  // 24 小时内新增
  const [{ last24h }] = await db
    .select({ last24h: count() })
    .from(leads)
    .where(sql`${leads.createdAt} > now() - interval '24 hours'`);

  // 待办：取全部，前端切「逾期 + 今天」展示
  const allTodos = await listPendingTodos();
  const now = Date.now();
  const todayEnd = startOfBeijingDay(new Date()) + 24 * 3600 * 1000;
  const overdueTodos = allTodos.filter((t) => t.nextFollowUpAt.getTime() < now);
  const todayTodos = allTodos.filter((t) => {
    const ts = t.nextFollowUpAt.getTime();
    return ts >= now && ts < todayEnd;
  });
  const dueSoon = [...overdueTodos, ...todayTodos];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-serif text-[12px] tracking-[0.3em] text-mute uppercase">Overview</p>
          <h1 className="mt-2 font-serif text-2xl tracking-tight sm:text-3xl">概览</h1>
        </div>
        <Link
          href="/admin/leads"
          className="rounded-full border border-hairline px-4 py-1.5 text-[13px] text-mute transition hover:border-hairline-strong hover:text-ink"
        >
          全部线索 →
        </Link>
      </header>

      {/* 顶部 4 个卡片 */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="线索总数" value={total} />
        <StatCard label="近 24 小时" value={Number(last24h)} accent="ok" />
        <StatCard label="待处理 (NEW)" value={statusMap.get("NEW") ?? 0} accent="warn" />
        <StatCard
          label="今日待办"
          value={dueSoon.length}
          accent={overdueTodos.length > 0 ? "bad" : "warn"}
        />
      </section>

      {/* 状态分布 */}
      <section className="rounded-2xl border border-hairline bg-white/60 p-6">
        <h2 className="mb-4 font-serif text-lg tracking-tight">状态分布</h2>
        <div className="flex flex-wrap gap-3">
          {LEAD_STATUS_OPTIONS.map((opt) => {
            const n = statusMap.get(opt.value) ?? 0;
            return (
              <div
                key={opt.value}
                className="flex items-center gap-2 rounded-full border border-hairline bg-paper-soft/60 px-3 py-1 text-[12px]"
              >
                <span className="text-mute">{opt.label}</span>
                <span className="font-medium tabular-nums text-ink">{n}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 今日待办（含逾期） */}
      <section className="rounded-2xl border border-hairline bg-white/60 p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-serif text-lg tracking-tight">今日待办</h2>
          <Link href="/admin/todos" className="text-[12px] text-mute hover:text-ink">
            查看全部 →
          </Link>
        </div>
        {dueSoon.length === 0 ? (
          <p className="py-6 text-center text-sm text-mute-soft">今天没有待跟进的线索 ☕️</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {dueSoon.slice(0, 8).map((t) => {
              const overdue = t.nextFollowUpAt.getTime() < now;
              return (
                <li
                  key={t.noteId}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 py-3 text-[13px]"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] tabular-nums ${
                        overdue
                          ? "bg-bad-bg/60 text-bad border border-bad/30"
                          : "bg-warn-bg/60 text-warn border border-warn/30"
                      }`}
                    >
                      {overdue ? "逾期" : "今天"}{" "}
                      {t.nextFollowUpAt.toLocaleTimeString("zh-CN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <Link
                      href={`/admin/leads/${t.leadId}`}
                      className="font-medium text-ink truncate hover:underline underline-offset-2"
                    >
                      {t.leadName}
                    </Link>
                    <code className="text-[11px] text-mute-soft">{t.leadCode}</code>
                  </div>
                  <span className="text-[12px] text-mute truncate max-w-[280px]">
                    {t.noteContent}
                  </span>
                </li>
              );
            })}
            {dueSoon.length > 8 && (
              <li className="py-2 text-center text-[11px] text-mute-soft">
                还有 {dueSoon.length - 8} 条，
                <Link href="/admin/todos" className="hover:text-ink">
                  查看全部
                </Link>
              </li>
            )}
          </ul>
        )}
      </section>

      {/* 最近 5 条 */}
      <section className="rounded-2xl border border-hairline bg-white/60 p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-serif text-lg tracking-tight">最近线索</h2>
          <Link href="/admin/leads" className="text-[12px] text-mute hover:text-ink">
            查看全部 →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="py-8 text-center text-sm text-mute">还没有线索。</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {recent.map((lead) => (
              <li
                key={lead.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 py-3 text-[13px]"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
                  <code className="text-[11px] text-mute-soft">{lead.code}</code>
                  <span className="font-medium text-ink truncate">{lead.name}</span>
                  <span className="text-[11px] text-mute">{lead.businessType}</span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={lead.status} />
                  <span className="text-[11px] text-mute-soft tabular-nums">
                    {formatTime(lead.createdAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="pt-6 text-center text-[11px] text-mute-soft">
        完整线索列表 / 看板 / 详情面板 在 M6–M7 实装。
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "ok" | "warn" | "bad";
}) {
  const accentColor =
    accent === "ok"
      ? "text-ok"
      : accent === "warn"
        ? "text-warn"
        : accent === "bad"
          ? "text-bad"
          : "text-ink";
  return (
    <div className="rounded-2xl border border-hairline bg-white/60 p-5">
      <div className="text-[11px] text-mute uppercase tracking-wider">{label}</div>
      <div className={`mt-2 font-serif text-3xl tabular-nums ${accentColor}`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const opt = LEAD_STATUS_OPTIONS.find((o) => o.value === status);
  return (
    <span className="rounded-full border border-hairline bg-paper-soft/80 px-2 py-0.5 text-[11px] text-mute">
      {opt?.label ?? status}
    </span>
  );
}

function formatTime(d: Date) {
  const now = Date.now();
  const t = new Date(d).getTime();
  const diffMin = Math.floor((now - t) / 60_000);
  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} 小时前`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `${diffD} 天前`;
  return new Date(d).toLocaleDateString("zh-CN");
}

/** 给定 Date，返回北京时间当日 00:00 的 UTC 毫秒数 */
function startOfBeijingDay(d: Date): number {
  const beijingOffsetMs = 8 * 3600 * 1000;
  const local = new Date(d.getTime() + beijingOffsetMs);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const day = local.getUTCDate();
  return Date.UTC(y, m, day, 0, 0, 0, 0) - beijingOffsetMs;
}
