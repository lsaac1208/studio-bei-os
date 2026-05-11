"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface Props {
  passwordFallbackEnabled: boolean;
}

const inputClass =
  "w-full rounded-xl border border-hairline bg-white/70 px-4 py-2.5 text-[14px] text-ink outline-none transition placeholder:text-mute-soft focus:border-ink/40 focus:bg-white focus:ring-2 focus:ring-ink/8";

export function SignInForm({ passwordFallbackEnabled }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/admin";

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  const onFeishuLogin = async () => {
    setSubmitting(true);
    try {
      // genericOAuth 客户端：会跳转到飞书 authorize 页面
      await authClient.signIn.oauth2({
        providerId: "feishu",
        callbackURL: redirectTo,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "未知错误";
      toast.error(`飞书登录失败：${msg}`);
      setSubmitting(false);
    }
  };

  const onPasswordLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      toast.error("请填邮箱和密码");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) {
        toast.error(`登录失败：${error.message ?? "邮箱或密码错误"}`);
        setSubmitting(false);
        return;
      }
      toast.success("登录成功，正在跳转…");
      startTransition(() => {
        router.push(redirectTo);
        router.refresh();
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "未知错误";
      toast.error(`登录失败：${msg}`);
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-5">
      {/* 飞书一键登录 */}
      <button
        type="button"
        onClick={onFeishuLogin}
        disabled={submitting}
        className={cn(
          "group flex w-full items-center justify-center gap-3 rounded-2xl border border-hairline bg-white/80 px-5 py-3.5 text-[14px] font-medium text-ink shadow-sm transition",
          "hover:border-hairline-strong hover:shadow-md",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <FeishuIcon className="h-5 w-5" />
        <span>{submitting ? "正在跳转飞书…" : "飞书一键登录"}</span>
      </button>

      {passwordFallbackEnabled && (
        <div className="border-hairline border-t pt-5">
          {!showPassword ? (
            <button
              type="button"
              onClick={() => setShowPassword(true)}
              className="block w-full text-center text-[12px] text-mute hover:text-ink"
            >
              使用应急密码登录 →
            </button>
          ) : (
            <form onSubmit={onPasswordLogin} className="space-y-3">
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="管理员邮箱"
                required
                className={inputClass}
                disabled={submitting}
              />
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="密码"
                required
                minLength={12}
                className={inputClass}
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={submitting}
                className={cn(
                  "w-full rounded-xl bg-ink px-4 py-2.5 text-[14px] font-medium text-paper transition",
                  "hover:bg-ink-soft active:scale-[0.99]",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                {submitting ? "登录中…" : "登录"}
              </button>
              <button
                type="button"
                onClick={() => setShowPassword(false)}
                className="block w-full text-center text-[11px] text-mute-soft hover:text-mute"
              >
                收起
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function FeishuIcon({ className }: { className?: string }) {
  // 飞书 logo 简化版 (官方蓝)
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <title>飞书</title>
      <path
        d="M11.5 6c-1 0-1.8.4-2.4 1.2L4 13.5c-.6.8-.4 2 .4 2.5l11.6 7.4c1 .6 2.4.5 3.3-.3l8.6-7.6c1-.9.9-2.5-.3-3.2L13 6.6c-.5-.4-1-.6-1.5-.6Z"
        fill="#3370FF"
      />
      <path
        d="M14.5 23.4l-9.6-6.1c-.5-.3-1.1.2-.9.7l2.2 5.6c.4 1 1.4 1.7 2.5 1.7h6c.7 0 1.1-.8.7-1.4l-.9-.5Z"
        fill="#00D6B9"
        opacity=".95"
      />
    </svg>
  );
}
