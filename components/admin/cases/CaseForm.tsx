"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createCase, updateCase } from "@/actions/cases";
import { BodyEditor } from "@/components/admin/cases/fields/BodyEditor";
import { ClientQuoteFields } from "@/components/admin/cases/fields/ClientQuoteFields";
import { CoverUploader } from "@/components/admin/cases/fields/CoverUploader";
import { DemoComponentSelect } from "@/components/admin/cases/fields/DemoComponentSelect";
import { GalleryManager } from "@/components/admin/cases/fields/GalleryManager";
import { MetricsEditor } from "@/components/admin/cases/fields/MetricsEditor";
import { TagsInput } from "@/components/admin/cases/fields/TagsInput";
import { CASE_LIMITS } from "@/lib/case-options";
import { type CaseUpsertInput, caseUpsertSchema } from "@/lib/validators";

interface Props {
  mode: "create" | "edit";
  caseId?: string;
  initial?: Partial<CaseUpsertInput>;
}

const EMPTY: CaseUpsertInput = {
  slug: "",
  title: "",
  subtitle: "",
  summary: "",
  outcomeSummary: "",
  clientName: "",
  industry: "",
  year: null,
  duration: "",
  coverImage: "",
  body: null,
  clientQuote: null,
  demoComponent: null,
  tags: [],
  techStack: [],
  metrics: [],
  gallery: [],
  published: false,
  featured: false,
};

export function CaseForm({ mode, caseId, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<CaseUpsertInput>(() => ({
    ...EMPTY,
    ...initial,
    // 数组 / 对象字段需要保险默认（initial 上可能为 undefined）
    tags: initial?.tags ?? [],
    techStack: initial?.techStack ?? [],
    metrics: initial?.metrics ?? [],
    gallery: initial?.gallery ?? [],
  }));

  function update<K extends keyof CaseUpsertInput>(key: K, value: CaseUpsertInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as string]) {
      setErrors((prev) => {
        const { [key as string]: _, ...rest } = prev;
        return rest;
      });
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = caseUpsertSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0]?.toString() ?? "_form";
        if (!fieldErrors[path]) fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      const first = parsed.error.issues[0];
      toast.error(`${first.path.join(".") || "字段"}：${first.message}`);
      return;
    }

    startTransition(async () => {
      try {
        if (mode === "create") {
          const r = await createCase(parsed.data);
          toast.success("案例已创建");
          router.push(`/admin/cases/${r.id}/edit`);
          router.refresh();
        } else if (caseId) {
          await updateCase({ id: caseId, patch: parsed.data });
          toast.success("已保存");
          router.refresh();
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "保存失败");
      }
    });
  };

  const fieldError = (key: string) => errors[key];

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* ─── 基本信息 ─── */}
      <Section title="基本信息" subtitle="标题 / slug / 摘要 — 列表页与详情页都依赖">
        <Row
          label="slug（URL）"
          hint="小写英数与短横线，如 qiguang-studio"
          error={fieldError("slug")}
        >
          <input
            type="text"
            value={form.slug}
            onChange={(e) => update("slug", e.target.value.toLowerCase())}
            placeholder="qiguang-studio"
            maxLength={64}
            className="w-full rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[14px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
          />
        </Row>
        <Row label="标题" error={fieldError("title")}>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="栖光摄影"
            maxLength={CASE_LIMITS.title}
            className="w-full rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[14px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
          />
        </Row>
        <Row label="副标题" error={fieldError("subtitle")}>
          <input
            type="text"
            value={form.subtitle ?? ""}
            onChange={(e) => update("subtitle", e.target.value)}
            placeholder="影楼预约 + 工作排期一体化"
            maxLength={CASE_LIMITS.subtitle}
            className="w-full rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[14px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
          />
        </Row>
        <Row label="摘要" hint="≤ 400 字，列表卡片摘要" error={fieldError("summary")}>
          <textarea
            value={form.summary}
            onChange={(e) => update("summary", e.target.value)}
            rows={3}
            maxLength={CASE_LIMITS.summary}
            className="w-full resize-y rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[13px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
          />
        </Row>
        <Row
          label="一句话成果"
          hint="如「上线 2 周排期冲突 -90%」，会高亮显示"
          error={fieldError("outcomeSummary")}
        >
          <input
            type="text"
            value={form.outcomeSummary ?? ""}
            onChange={(e) => update("outcomeSummary", e.target.value)}
            placeholder="上线 2 周排期冲突 -90%"
            maxLength={CASE_LIMITS.outcomeSummary}
            className="w-full rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[14px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
          />
        </Row>
      </Section>

      {/* ─── 客户档案 ─── */}
      <Section title="客户档案" subtitle="详情页 meta 行展示">
        <div className="grid gap-4 sm:grid-cols-2">
          <Row label="客户名" error={fieldError("clientName")}>
            <input
              type="text"
              value={form.clientName ?? ""}
              onChange={(e) => update("clientName", e.target.value)}
              maxLength={CASE_LIMITS.clientName}
              className="w-full rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[14px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
            />
          </Row>
          <Row label="行业" error={fieldError("industry")}>
            <input
              type="text"
              value={form.industry ?? ""}
              onChange={(e) => update("industry", e.target.value)}
              placeholder="摄影 / 影像服务"
              maxLength={CASE_LIMITS.industry}
              className="w-full rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[14px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
            />
          </Row>
          <Row label="年份" error={fieldError("year")}>
            <input
              type="number"
              value={form.year ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                update("year", v === "" ? null : Number(v));
              }}
              min={2000}
              max={2100}
              placeholder="2025"
              className="w-full rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[14px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
            />
          </Row>
          <Row label="项目周期" error={fieldError("duration")}>
            <input
              type="text"
              value={form.duration ?? ""}
              onChange={(e) => update("duration", e.target.value)}
              placeholder="4 周"
              maxLength={CASE_LIMITS.duration}
              className="w-full rounded-xl border border-hairline bg-white/70 px-3 py-2 text-[14px] outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/8"
            />
          </Row>
        </div>
        <Row label="标签" hint="回车或逗号添加，最多 12 个">
          <TagsInput value={form.tags} onChange={(v) => update("tags", v)} />
        </Row>
        <Row label="技术栈" hint="如 Next.js / Postgres，最多 16 个">
          <TagsInput
            value={form.techStack}
            onChange={(v) => update("techStack", v)}
            placeholder="Next.js"
            max={16}
            maxItemLength={60}
          />
        </Row>
      </Section>

      {/* ─── 媒体 ─── */}
      <Section title="封面与图集">
        <Row label="封面图">
          <CoverUploader
            value={form.coverImage ?? ""}
            onChange={(url) => update("coverImage", url)}
            slug={form.slug || undefined}
          />
        </Row>
        <Row label="图集" hint="项目截图 / 实景图，每张需填 alt">
          <GalleryManager
            value={form.gallery}
            onChange={(v) => update("gallery", v)}
            slug={form.slug || undefined}
          />
        </Row>
      </Section>

      {/* ─── Demo 组件挂接 ─── */}
      <Section title="互动 Demo" subtitle="挂接现有 React 演示组件，详情页内联展示">
        <Row label="挂接组件">
          <DemoComponentSelect
            value={form.demoComponent ?? null}
            onChange={(v) => update("demoComponent", v)}
          />
        </Row>
      </Section>

      {/* ─── 正文 ─── */}
      <Section title="详情正文" subtitle="背景 / 挑战 / 方案 / 成果，建议 300-1000 字">
        <BodyEditor value={form.body ?? null} onChange={(v) => update("body", v)} />
      </Section>

      {/* ─── 关键指标 ─── */}
      <Section title="关键指标" subtitle="数字化呈现成果，会以卡片组形式展示">
        <MetricsEditor value={form.metrics} onChange={(v) => update("metrics", v)} />
      </Section>

      {/* ─── 客户证言 ─── */}
      <Section title="客户证言">
        <ClientQuoteFields
          value={form.clientQuote ?? null}
          onChange={(v) => update("clientQuote", v)}
        />
      </Section>

      {/* ─── 发布控制 ─── */}
      <Section title="发布">
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-[14px] text-ink">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => update("published", e.target.checked)}
              className="h-4 w-4 rounded border-hairline accent-ink"
            />
            已发布（公开页可见）
          </label>
          <label className="flex items-center gap-2 text-[14px] text-ink">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => update("featured", e.target.checked)}
              className="h-4 w-4 rounded border-hairline accent-ink"
            />
            首页推荐位
          </label>
        </div>
      </Section>

      {/* ─── 操作 ─── */}
      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-hairline border-t bg-paper-soft/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border border-hairline px-4 py-1.5 text-[13px] text-mute transition hover:border-hairline-strong hover:text-ink"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-ink px-6 py-1.5 text-[13px] text-paper transition hover:bg-ink/90 disabled:opacity-50"
        >
          {pending ? "保存中…" : mode === "create" ? "创建案例" : "保存修改"}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
// 内部布局组件
// ─────────────────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-hairline bg-white/40 p-5">
      <header>
        <h2 className="font-medium text-[15px] text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[12px] text-mute-soft">{subtitle}</p>}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Row({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-medium text-[12.5px] text-ink">{label}</span>
        {hint && <span className="text-[11px] text-mute-soft">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-[11px] text-bad">{error}</p>}
    </div>
  );
}
