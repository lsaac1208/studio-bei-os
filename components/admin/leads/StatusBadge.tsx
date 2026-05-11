import { LEAD_STATUS_OPTIONS } from "@/lib/lead-options";
import { cn } from "@/lib/utils";

const TONE_CLASS: Record<string, string> = {
  info: "border-info/30 bg-info-bg text-info",
  ok: "border-ok/30 bg-ok-bg text-ok",
  warn: "border-warn/30 bg-warn-bg text-warn",
  bad: "border-bad/30 bg-bad-bg text-bad",
  mute: "border-hairline bg-paper-soft/80 text-mute",
};

interface Props {
  status: string;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, className, size = "sm" }: Props) {
  const opt = LEAD_STATUS_OPTIONS.find((o) => o.value === status);
  const tone = opt?.tone ?? "mute";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 font-medium tabular-nums",
        size === "sm" ? "py-0.5 text-[11px]" : "py-1 text-[12px]",
        TONE_CLASS[tone],
        className,
      )}
    >
      {opt?.label ?? status}
    </span>
  );
}
