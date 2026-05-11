"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/actions/auth";

const NAV_LINKS = [
  { href: "/admin", label: "概览" },
  { href: "/admin/leads", label: "线索列表" },
  { href: "/admin/leads/kanban", label: "线索看板" },
  { href: "/admin/todos", label: "待办" },
  { href: "/admin/search", label: "搜索" },
  { href: "/admin/landing", label: "首页内容" },
  { href: "/admin/cases", label: "案例" },
  { href: "/admin/faqs", label: "FAQ" },
  { href: "/admin/settings", label: "站点设置" },
];

interface Props {
  displayName: string;
  todoCount?: number;
}

export function AdminMobileMenu({ displayName, todoCount = 0 }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative md:hidden">
      <button
        type="button"
        aria-label={open ? "关闭菜单" : "打开菜单"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-white/60 text-mute transition hover:border-hairline-strong hover:text-ink"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          {open ? (
            <path
              d="M3 3l10 10M13 3L3 13"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M2 4h12M2 8h12M2 12h12"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border border-hairline bg-paper-soft shadow-lg">
          <div className="border-hairline border-b bg-paper/60 px-4 py-2.5">
            <p className="truncate text-[12px] text-mute">{displayName}</p>
          </div>
          <nav className="flex flex-col py-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 text-[14px] text-ink transition hover:bg-paper-soft/80"
              >
                <span>{link.label}</span>
                {link.href === "/admin/todos" && todoCount > 0 && (
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-bad px-1.5 font-medium text-[11px] text-paper tabular-nums leading-none">
                    {todoCount > 99 ? "99+" : todoCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <form action={signOutAction} className="border-hairline border-t">
            <button
              type="submit"
              className="w-full px-4 py-2.5 text-left text-[13px] text-mute transition hover:bg-paper-soft/80 hover:text-ink"
            >
              登出
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
