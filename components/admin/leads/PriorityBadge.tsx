import { cn } from "@/lib/utils";

interface Props {
  priority: string;
  className?: string;
}

const STYLE: Record<string, { label: string; cls: string; dot: string }> = {
  HIGH: {
    label: "高",
    cls: "border-bad/30 bg-bad-bg text-bad",
    dot: "bg-bad",
  },
  NORMAL: {
    label: "普通",
    cls: "border-hairline bg-paper-soft/80 text-mute",
    dot: "bg-mute",
  },
  LOW: {
    label: "低",
    cls: "border-hairline bg-paper-soft/80 text-mute-soft",
    dot: "bg-mute-soft",
  },
};

export function PriorityBadge({ priority, className }: Props) {
  const s = STYLE[priority] ?? STYLE.NORMAL;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        s.cls,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}
