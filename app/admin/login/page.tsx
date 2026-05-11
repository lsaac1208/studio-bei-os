import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignInForm } from "@/components/admin/SignInForm";
import { getCurrentSession, isAdminAllowed } from "@/lib/auth-server";
import { getBooleanSetting } from "@/lib/settings";

export const metadata: Metadata = {
  title: "后台登录",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  // 已是合法 admin → 直接放行
  const session = await getCurrentSession();
  if (session && isAdminAllowed(session.user)) {
    redirect("/admin");
  }

  // settings 表里的开关控制是否显示应急密码表单
  const passwordFallback = await getBooleanSetting("auth.allowPasswordFallback", false);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-10 bg-paper px-6 py-12">
      <header className="text-center">
        <p className="font-serif text-[12px] tracking-[0.3em] text-mute uppercase">Studio Bei OS</p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight text-ink">后台登录</h1>
        <p className="mt-3 max-w-sm text-sm text-mute">
          团队成员请用飞书一键登录。
          <br />
          应急通道仅在异常情况下临时开放。
        </p>
      </header>

      <Suspense fallback={null}>
        <SignInForm passwordFallbackEnabled={passwordFallback} />
      </Suspense>

      <p className="max-w-sm text-center text-[11px] text-mute-soft">
        本系统仅授权管理员使用。
        <br />
        如果你看到这里但不知道为什么，关掉它就好。
      </p>
    </main>
  );
}
