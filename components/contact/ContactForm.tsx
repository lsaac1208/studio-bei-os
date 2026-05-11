"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type FieldPath, useForm } from "react-hook-form";
import { toast } from "sonner";
import { BUDGET_OPTIONS, BUSINESS_TYPE_OPTIONS, TIMELINE_OPTIONS } from "@/lib/lead-options";
import { cn } from "@/lib/utils";
import { type LeadCreateInput, leadCreateSchema } from "@/lib/validators";

export function ContactForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LeadCreateInput>({
    resolver: zodResolver(leadCreateSchema),
    defaultValues: {
      name: "",
      wechat: "",
      phone: "",
      email: "",
      businessType: "APPOINTMENT",
      budgetRange: "UNSURE",
      timeline: "UNSURE",
      painPoint: "",
      message: "",
      source: "",
      website: "",
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = form;

  const businessType = watch("businessType");

  const onSubmit = async (data: LeadCreateInput) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          source: typeof document !== "undefined" ? document.referrer || "" : "",
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        code?: string;
        error?: string;
        fields?: Record<string, string>;
      };

      if (!res.ok || !json.ok) {
        if (json.fields) {
          for (const [field, msg] of Object.entries(json.fields)) {
            setError(field as FieldPath<LeadCreateInput>, { message: msg });
          }
        }
        toast(json.error ?? "提交失败，请稍后再试。");
        return;
      }

      router.push(`/contact/thanks?code=${encodeURIComponent(json.code ?? "")}`);
    } catch (err) {
      console.error("[contact form] submit error", err);
      toast("网络异常，请稍后再试。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-10">
      {/* 1. 称呼 + 联系方式 */}
      <Section index="01" title="告诉我你是谁" hint="至少留一种联系方式，我会主动加你 / 回复你。">
        <Field label="称呼" required error={errors.name?.message}>
          <input
            type="text"
            placeholder="例如：林工 / 周姐 / Anna"
            autoComplete="name"
            {...register("name")}
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="微信号" error={errors.wechat?.message}>
            <input
              type="text"
              placeholder="wxid_..."
              autoComplete="off"
              {...register("wechat")}
              className={inputClass}
            />
          </Field>
          <Field label="手机号" error={errors.phone?.message}>
            <input
              type="tel"
              inputMode="tel"
              placeholder="13800000000"
              autoComplete="tel"
              {...register("phone")}
              className={inputClass}
            />
          </Field>
          <Field label="邮箱" error={errors.email?.message}>
            <input
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...register("email")}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      {/* 2. 项目方向 */}
      <Section
        index="02"
        title="想做什么方向"
        hint="不确定的话先选最接近的，我看到需求描述后会再确认。"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {BUSINESS_TYPE_OPTIONS.map((opt) => {
            const active = opt.value === businessType;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setValue("businessType", opt.value, { shouldValidate: true })}
                className={cn(
                  "flex flex-col items-start rounded-2xl border p-4 text-left transition-all",
                  active
                    ? "border-studio-1 bg-studio-2/40 shadow-[0_0_0_3px_rgba(229,96,79,0.12)]"
                    : "border-hairline bg-white/50 hover:border-studio-1/40",
                )}
              >
                <strong className="font-bold text-[15px] tracking-tight">{opt.label}</strong>
                <small className="mt-1 text-[12px] text-mute">{opt.hint}</small>
              </button>
            );
          })}
        </div>
        {errors.businessType && (
          <p className="mt-2 text-[12px] text-bad">{errors.businessType.message}</p>
        )}
      </Section>

      {/* 3. 预算 + 时间 */}
      <Section index="03" title="预算 + 期望时间" hint="给个区间就行，后面会一起讨论调整。">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="预算区间" required error={errors.budgetRange?.message}>
            <select {...register("budgetRange")} className={inputClass}>
              {BUDGET_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="期望开工时间" error={errors.timeline?.message}>
            <select {...register("timeline")} className={inputClass}>
              {TIMELINE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      {/* 4. 描述 */}
      <Section
        index="04"
        title="现在怎么做、卡在哪里"
        hint="哪怕只写两行：现在用什么方式接单 / 记录 / 跟进，最浪费人工的地方是哪里。"
      >
        <Field label="最大的卡点（选填）" error={errors.painPoint?.message}>
          <textarea
            rows={2}
            placeholder="例如：客户从微信问询到下定金，要在群里来回 5 次。"
            {...register("painPoint")}
            className={cn(inputClass, "min-h-16 resize-y leading-relaxed")}
          />
        </Field>

        <Field label="项目描述" required error={errors.message?.message}>
          <textarea
            rows={5}
            placeholder="把现在的业务流程、想要变成什么样、已经看过的参考、希望什么时候上线 …… 都可以写。"
            {...register("message")}
            className={cn(inputClass, "min-h-32 resize-y leading-relaxed")}
          />
        </Field>
      </Section>

      {/* honeypot：bot 会填，真人看不到 */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        {...register("website")}
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      {/* submit */}
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] text-mute">
          提交即代表同意：你留下的信息仅用于本项目沟通和报价，不会用于其他用途。
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-between gap-3 rounded-full bg-ink px-6 py-3.5 font-semibold text-[14px] text-paper transition-all hover:-translate-y-px hover:bg-studio-1 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[200px]"
        >
          <span>{submitting ? "提交中…" : "提交需求"}</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-hairline bg-white/70 px-4 py-3 text-[14px] text-ink outline-none transition-shadow placeholder:text-mute-soft focus:border-studio-1 focus:shadow-[0_0_0_3px_rgba(229,96,79,0.16)]";

function Section({
  index,
  title,
  hint,
  children,
}: {
  index: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4">
      <header>
        <span className="font-mono text-[11px] text-mute uppercase tracking-[0.14em]">
          Step {index}
        </span>
        <h2 className="mt-1.5 font-bold text-[22px] leading-tight tracking-[-0.02em]">{title}</h2>
        {hint && <p className="mt-1.5 text-[13px] text-mute leading-relaxed">{hint}</p>}
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: children 是 input/select/textarea 通过 register 注入
    <label className="grid gap-1.5">
      <span className="flex items-center gap-1.5 font-bold text-[11px] text-mute uppercase tracking-[0.14em]">
        {label}
        {required && <em className="text-studio-1 not-italic">*</em>}
      </span>
      {children}
      {error && <span className="text-[12px] text-bad">{error}</span>}
    </label>
  );
}
