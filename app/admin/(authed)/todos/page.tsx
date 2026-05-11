import type { Metadata } from "next";
import Link from "next/link";
import { TodoRow } from "@/components/admin/todos/TodoRow";
import { listPendingTodos, type PendingTodo } from "@/lib/queries/leads";

export const metadata: Metadata = { title: "待办" };

// 数据每次进页面都要新鲜
export const dynamic = "force-dynamic";

interface Bucket {
  id: string;
  label: string;
  items: PendingTodo[];
  // 用于空态文案
  hint: string;
  // 头部色调
  tone: "bad" | "warn" | "info" | "mute";
}

export default async function TodosPage() {
  const todos = await listPendingTodos();
  const buckets = bucketize(todos);
  const total = todos.length;
  const overdue = buckets.find((b) => b.id === "overdue")?.items.length ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-serif text-[12px] tracking-[0.3em] text-mute uppercase">Todos</p>
          <h1 className="mt-2 font-serif text-2xl tracking-tight sm:text-3xl">待办</h1>
          <p className="mt-1 text-[12px] text-mute-soft">
            备注里设置「下次跟进」即变为待办；标记完成后自动归档。
          </p>
        </div>
        <div className="flex items-baseline gap-3 text-[12px] text-mute tabular-nums">
          <span>
            共 <span className="font-medium text-ink">{total}</span> 条
          </span>
          {overdue > 0 && (
            <span className="text-bad">
              逾期 <span className="font-medium">{overdue}</span>
            </span>
          )}
        </div>
      </header>

      {total === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          {buckets
            .filter((b) => b.items.length > 0)
            .map((b) => (
              <section key={b.id}>
                <h2 className="mb-2 flex items-baseline gap-2 font-serif text-[13px] tracking-wider uppercase text-mute">
                  <ToneDot tone={b.tone} />
                  <span>{b.label}</span>
                  <span className="text-[12px] text-mute-soft tabular-nums">{b.items.length}</span>
                </h2>
                <ol className="rounded-2xl border border-hairline bg-white/60 px-2">
                  {b.items.map((t) => (
                    <TodoRow
                      key={t.noteId}
                      noteId={t.noteId}
                      noteContent={t.noteContent}
                      nextFollowUpAt={t.nextFollowUpAt}
                      leadId={t.leadId}
                      leadCode={t.leadCode}
                      leadName={t.leadName}
                      leadStatus={t.leadStatus}
                      leadPriority={t.leadPriority}
                    />
                  ))}
                </ol>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}

function ToneDot({ tone }: { tone: "bad" | "warn" | "info" | "mute" }) {
  const cls =
    tone === "bad"
      ? "bg-bad"
      : tone === "warn"
        ? "bg-warn"
        : tone === "info"
          ? "bg-info"
          : "bg-mute";
  return <span aria-hidden className={`inline-block h-1.5 w-1.5 rounded-full ${cls}`} />;
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-hairline bg-white/60 p-12 text-center">
      <p className="text-[14px] text-mute">没有待办，去喝杯咖啡。</p>
      <p className="mt-2 text-[12px] text-mute-soft">
        在线索详情页添加备注时，设置「下次跟进」时间即可生成待办。
      </p>
      <Link
        href="/admin/leads"
        className="mt-4 inline-block rounded-full border border-hairline px-4 py-1.5 text-[12px] text-mute transition hover:border-hairline-strong hover:text-ink"
      >
        进入线索列表 →
      </Link>
    </div>
  );
}

/**
 * 分桶：逾期 / 今天 / 明天 / 本周内 / 之后。
 * 边界以北京时间当日 00:00 为基准。
 */
function bucketize(todos: PendingTodo[]): Bucket[] {
  const now = new Date();
  // 北京时间当日 00:00 UTC 时刻
  const bjMidnight = startOfDayInBeijing(now);
  const tomorrow = bjMidnight + 24 * 3600 * 1000;
  const dayAfter = tomorrow + 24 * 3600 * 1000;
  const weekEnd = bjMidnight + 7 * 24 * 3600 * 1000;

  const buckets: Bucket[] = [
    { id: "overdue", label: "逾期", tone: "bad", hint: "已超过预计跟进时间", items: [] },
    { id: "today", label: "今天", tone: "warn", hint: "今天要跟进", items: [] },
    { id: "tomorrow", label: "明天", tone: "info", hint: "明天预计跟进", items: [] },
    { id: "thisWeek", label: "本周内", tone: "info", hint: "未来 7 天内", items: [] },
    { id: "later", label: "之后", tone: "mute", hint: "再之后", items: [] },
  ];

  for (const t of todos) {
    const ts = t.nextFollowUpAt.getTime();
    if (ts < bjMidnight) buckets[0].items.push(t);
    else if (ts < tomorrow) buckets[1].items.push(t);
    else if (ts < dayAfter) buckets[2].items.push(t);
    else if (ts < weekEnd) buckets[3].items.push(t);
    else buckets[4].items.push(t);
  }
  return buckets;
}

/** 给定 Date，返回北京时间当日 00:00 的 UTC 毫秒数 */
function startOfDayInBeijing(d: Date): number {
  // 转到北京时区表示
  const beijingOffsetMs = 8 * 3600 * 1000;
  const local = new Date(d.getTime() + beijingOffsetMs);
  // 取出 yyyy/mm/dd（按 UTC 字段读）
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const day = local.getUTCDate();
  // 重新构造北京时间 00:00 → UTC 时间为 -8h
  return Date.UTC(y, m, day, 0, 0, 0, 0) - beijingOffsetMs;
}
