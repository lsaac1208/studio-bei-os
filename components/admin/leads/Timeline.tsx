import type { TimelineItem } from "@/lib/queries/leads";
import { cn } from "@/lib/utils";
import { NoteCompleteButton } from "./NoteCompleteButton";

interface Props {
  items: TimelineItem[];
}

export function Timeline({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-hairline bg-white/60 p-6 text-center text-sm text-mute-soft">
        暂无活动记录
      </div>
    );
  }

  return (
    <ol className="relative space-y-5 border-hairline border-l pl-6">
      {items.map((item) => (
        <TimelineEntry key={`${item.kind}-${item.id}`} item={item} />
      ))}
    </ol>
  );
}

function TimelineEntry({ item }: { item: TimelineItem }) {
  const meta = visualOf(item);
  return (
    <li className="relative">
      <span
        className={cn(
          "-left-[7px] absolute top-1.5 inline-block h-2.5 w-2.5 rounded-full ring-2 ring-paper",
          meta.dotClass,
        )}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn("font-medium text-[12px] uppercase tracking-wider", meta.labelClass)}
            >
              {meta.label}
            </span>
            {item.kind === "note" &&
              item.nextFollowUpAt &&
              (item.completedAt ? (
                <span className="rounded-full border border-ok/30 bg-ok-bg/60 px-2 py-0.5 text-[10px] text-ok">
                  ✓ 已完成 · 原计划 {formatDate(item.nextFollowUpAt)}
                </span>
              ) : (
                <>
                  <span className="rounded-full border border-info/30 bg-info-bg px-2 py-0.5 text-[10px] text-info">
                    下次跟进：{formatDate(item.nextFollowUpAt)}
                  </span>
                  <NoteCompleteButton noteId={item.id} />
                </>
              ))}
          </div>
          <p
            className={cn(
              "mt-1 whitespace-pre-wrap text-[13px] leading-relaxed",
              item.kind === "note" && item.completedAt
                ? "text-mute line-through decoration-mute/40"
                : "text-ink",
            )}
          >
            {item.content}
          </p>
        </div>
        <time className="shrink-0 whitespace-nowrap text-[11px] text-mute-soft tabular-nums">
          {formatDateTime(item.createdAt)}
        </time>
      </div>
    </li>
  );
}

function visualOf(item: TimelineItem): {
  label: string;
  dotClass: string;
  labelClass: string;
} {
  if (item.kind === "note") {
    return { label: "备注", dotClass: "bg-ink", labelClass: "text-ink" };
  }
  switch (item.type) {
    case "CREATE":
      return { label: "创建", dotClass: "bg-info", labelClass: "text-info" };
    case "STATUS_CHANGE":
      return { label: "状态变更", dotClass: "bg-warn", labelClass: "text-warn" };
    case "PRIORITY_CHANGE":
      return { label: "优先级变更", dotClass: "bg-warn", labelClass: "text-warn" };
    case "NOTE_ADDED":
      return { label: "备注摘要", dotClass: "bg-mute", labelClass: "text-mute" };
    case "FEISHU_CARD_ACTION":
      return { label: "飞书操作", dotClass: "bg-ok", labelClass: "text-ok" };
    default:
      return { label: item.type, dotClass: "bg-mute", labelClass: "text-mute" };
  }
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("zh-CN", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDateTime(d: Date) {
  const dt = new Date(d);
  const now = Date.now();
  const diffMs = now - dt.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  return dt.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
