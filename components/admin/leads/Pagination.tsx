import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
  page: number;
  pageCount: number;
  /** Builder for the href given a target page (1-based). */
  buildHref: (page: number) => string;
}

export function Pagination({ page, pageCount, buildHref }: Props) {
  if (pageCount <= 1) return null;

  // 简化分页：只显示首页 / 上一页 / 当前 / 下一页 / 末页（够后台用）
  const prev = Math.max(1, page - 1);
  const next = Math.min(pageCount, page + 1);

  return (
    <nav className="flex items-center justify-between gap-2 text-[12px]">
      <span className="text-mute">
        第 <span className="font-medium text-ink tabular-nums">{page}</span> /{" "}
        <span className="tabular-nums">{pageCount}</span> 页
      </span>
      <div className="flex items-center gap-1">
        <PageLink href={buildHref(1)} disabled={page === 1}>
          首页
        </PageLink>
        <PageLink href={buildHref(prev)} disabled={page === 1}>
          上一页
        </PageLink>
        <PageLink href={buildHref(next)} disabled={page === pageCount}>
          下一页
        </PageLink>
        <PageLink href={buildHref(pageCount)} disabled={page === pageCount}>
          末页
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="cursor-not-allowed rounded-md border border-hairline bg-paper-soft/40 px-2.5 py-1 text-mute-soft">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={cn(
        "rounded-md border border-hairline bg-white/60 px-2.5 py-1 text-mute transition",
        "hover:border-hairline-strong hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
