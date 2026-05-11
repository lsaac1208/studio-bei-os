import Link from "next/link";
import { signOutAction } from "@/actions/auth";
import type { AuthUser } from "@/lib/auth";
import { countPendingTodos } from "@/lib/queries/leads";
import { AdminMobileMenu } from "./AdminMobileMenu";
import { SearchInput } from "./SearchInput";

interface Props {
  user: AuthUser;
}

export const NAV_LINKS = [
  { href: "/admin", label: "概览" },
  { href: "/admin/leads", label: "线索" },
  { href: "/admin/todos", label: "待办" },
  { href: "/admin/landing", label: "内容" },
  { href: "/admin/cases", label: "案例" },
  { href: "/admin/faqs", label: "FAQ" },
  { href: "/admin/settings", label: "设置" },
];

export async function AdminTopbar({ user }: Props) {
  const displayName = user.name || user.email || "管理员";
  // 顶栏徽章：仅算 24h 内 + 逾期未完成的（避免远期任务把数字撑大）
  let todoCount = 0;
  try {
    todoCount = await countPendingTodos();
  } catch {
    // 顶栏不能因数据库异常而崩，静默兜底
    todoCount = 0;
  }

  return (
    <header className="sticky top-0 z-40 border-hairline border-b bg-paper-soft/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-6 sm:px-6">
        <div className="flex min-w-0 items-center gap-4 sm:gap-7">
          <Link
            href="/admin"
            className="shrink-0 font-serif font-bold text-[15px] tracking-tight text-ink hover:text-ink-soft sm:text-[16px]"
          >
            Studio Bei OS
          </Link>
          {/* 桌面端横向 nav */}
          <nav className="hidden items-center gap-5 text-[13px] text-mute md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative inline-flex items-center gap-1.5 transition hover:text-ink"
              >
                {link.label}
                {link.href === "/admin/todos" && todoCount > 0 && <TodoBadge count={todoCount} />}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:block">
            <SearchInput compact />
          </div>
          <span className="hidden truncate max-w-[140px] text-[12px] text-mute sm:inline">
            {displayName}
          </span>
          <form action={signOutAction} className="hidden sm:block">
            <button
              type="submit"
              className="rounded-md border border-hairline px-3 py-1 text-[12px] text-mute transition hover:border-hairline-strong hover:text-ink"
            >
              登出
            </button>
          </form>
          {/* 移动端汉堡菜单 */}
          <AdminMobileMenu displayName={displayName} todoCount={todoCount} />
        </div>
      </div>
    </header>
  );
}

function TodoBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-bad px-1 font-medium text-[10px] text-paper tabular-nums leading-none">
      {count > 99 ? "99+" : count}
    </span>
  );
}
