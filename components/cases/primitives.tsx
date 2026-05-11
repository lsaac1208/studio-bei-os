/**
 * 三个案例共用的小型 UI primitives：MiniButton / StatusTag / Empty。
 * 所有 case 的状态 chip / 操作按钮都从这里复用。
 */

import type { ButtonHTMLAttributes } from "react";
import { STATUS_TEXT } from "@/lib/case/format";
import { cn } from "@/lib/utils";

type MiniButtonVariant = "default" | "primary" | "danger";

type MiniButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: MiniButtonVariant;
};

const variantClass: Record<MiniButtonVariant, string> = {
  default:
    "border border-hairline bg-paper text-ink hover:border-ink hover:bg-ink hover:text-paper",
  primary: "border border-ink bg-ink text-paper hover:border-studio-1 hover:bg-studio-1",
  danger: "border border-transparent bg-bad-bg text-bad hover:bg-bad hover:text-white",
};

export function MiniButton({
  variant = "default",
  className,
  type = "button",
  ...rest
}: MiniButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-bold text-[11px] tracking-wide transition-colors",
        variantClass[variant],
        className,
      )}
      {...rest}
    />
  );
}

type StatusKey =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "paid"
  | "shipped"
  | "hot"
  | "medium"
  | "following"
  | "new"
  | "closed"
  | "ok"
  | "low"
  | "out";

const statusClass: Record<StatusKey, string> = {
  pending: "bg-warn-bg text-warn",
  paid: "bg-warn-bg text-warn",
  confirmed: "bg-info-bg text-info",
  shipped: "bg-info-bg text-info",
  medium: "bg-info-bg text-info",
  completed: "bg-ok-bg text-ok",
  closed: "bg-ok-bg text-ok",
  ok: "bg-ok-bg text-ok",
  cancelled: "bg-bad-bg text-bad",
  hot: "bg-bad-bg text-bad",
  out: "bg-bad-bg text-bad",
  following: "bg-paper-soft text-ink",
  new: "bg-paper-soft text-ink",
  low: "bg-warn-bg text-warn",
};

export function StatusTag({ status }: { status: StatusKey }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold text-[10px] uppercase tracking-wider",
        statusClass[status],
      )}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {STATUS_TEXT[status] ?? status}
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-hairline-strong border-dashed p-5 text-center text-[13px] text-mute">
      {children}
    </div>
  );
}
