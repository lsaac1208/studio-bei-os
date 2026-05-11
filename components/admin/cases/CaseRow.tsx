"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteCase, moveCase, toggleFeaturedCase, togglePublishedCase } from "@/actions/cases";
import type { Case } from "@/db/schema";
import { cn } from "@/lib/utils";

interface Props {
  row: Case;
  isFirst: boolean;
  isLast: boolean;
}

export function CaseRow({ row, isFirst, isLast }: Props) {
  const [pending, startTransition] = useTransition();

  const onTogglePublish = () => {
    startTransition(async () => {
      try {
        await togglePublishedCase({ id: row.id, published: !row.published });
        toast.success(row.published ? "已设为未发布" : "已发布");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "切换失败");
      }
    });
  };

  const onToggleFeatured = () => {
    startTransition(async () => {
      try {
        await toggleFeaturedCase({ id: row.id, featured: !row.featured });
        toast.success(row.featured ? "已取消推荐" : "已设为首页推荐");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "切换失败");
      }
    });
  };

  const onMove = (direction: "up" | "down") => {
    startTransition(async () => {
      try {
        await moveCase({ id: row.id, direction });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "移动失败");
      }
    });
  };

  const onDelete = () => {
    if (!confirm(`确定删除案例「${row.title}」？此操作不可撤销。`)) return;
    startTransition(async () => {
      try {
        await deleteCase({ id: row.id });
        toast.success("已删除");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "删除失败");
      }
    });
  };

  return (
    <article
      className={cn(
        "rounded-2xl border bg-white/60 p-5",
        row.published ? "border-hairline" : "border-hairline border-dashed opacity-70",
      )}
    >
      <div className="flex flex-wrap items-start gap-4 sm:flex-nowrap">
        {/* 缩略图 */}
        <div className="h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-hairline bg-paper-soft">
          {row.coverImage ? (
            // biome-ignore lint/performance/noImgElement: 后台缩略图无需 next/image
            <img src={row.coverImage} alt={row.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-mute-soft">
              无封面
            </div>
          )}
        </div>

        {/* 内容 */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-[15px] text-ink truncate">{row.title}</h3>
            {!row.published && (
              <span className="rounded-full border border-hairline bg-paper-soft/70 px-2 py-0.5 text-[10px] text-mute">
                未发布
              </span>
            )}
            {row.featured && row.published && (
              <span className="rounded-full bg-ink/8 px-2 py-0.5 text-[10px] text-ink">
                首页推荐
              </span>
            )}
            {row.demoComponent && (
              <span className="rounded-full border border-hairline bg-white/40 px-2 py-0.5 text-[10px] text-mute-soft">
                demo: {row.demoComponent}
              </span>
            )}
          </div>
          {row.subtitle && <p className="text-[12px] text-mute">{row.subtitle}</p>}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-mute-soft">
            <code>/cases/{row.slug}</code>
            {row.industry && <span>· {row.industry}</span>}
            {row.year && <span>· {row.year}</span>}
            {row.duration && <span>· {row.duration}</span>}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-hairline border-t pt-3 text-[11px] text-mute">
        <button
          type="button"
          onClick={() => onMove("up")}
          disabled={pending || isFirst}
          className="rounded-md border border-hairline px-2 py-0.5 transition hover:border-hairline-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="上移"
        >
          ↑ 上移
        </button>
        <button
          type="button"
          onClick={() => onMove("down")}
          disabled={pending || isLast}
          className="rounded-md border border-hairline px-2 py-0.5 transition hover:border-hairline-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="下移"
        >
          ↓ 下移
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onToggleFeatured}
          disabled={pending}
          className="rounded-md border border-hairline px-2 py-0.5 transition hover:border-hairline-strong hover:text-ink disabled:opacity-40"
        >
          {row.featured ? "取消推荐" : "首页推荐"}
        </button>
        <button
          type="button"
          onClick={onTogglePublish}
          disabled={pending}
          className="rounded-md border border-hairline px-2 py-0.5 transition hover:border-hairline-strong hover:text-ink disabled:opacity-40"
        >
          {row.published ? "设为未发布" : "发布"}
        </button>
        {row.published && (
          <Link
            href={`/cases/${row.slug}`}
            target="_blank"
            rel="noopener"
            className="rounded-md border border-hairline px-2 py-0.5 transition hover:border-hairline-strong hover:text-ink"
          >
            查看
          </Link>
        )}
        <Link
          href={`/admin/cases/${row.id}/edit`}
          className="rounded-md border border-hairline px-2 py-0.5 transition hover:border-hairline-strong hover:text-ink"
        >
          编辑
        </Link>
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="rounded-md border border-hairline px-2 py-0.5 transition hover:border-bad/50 hover:text-bad"
        >
          删除
        </button>
      </div>
    </article>
  );
}
