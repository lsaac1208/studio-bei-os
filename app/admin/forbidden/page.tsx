import type { Metadata } from "next";
import Link from "next/link";
import { signOutAction } from "@/actions/auth";

export const metadata: Metadata = {
  title: "无访问权限",
  robots: { index: false, follow: false },
};

/**
 * 已登录但不在管理员白名单 → 跳到这里。
 * 不在 (authed) 路由组下，无 layout 鉴权，避免死循环。
 */
export default function ForbiddenPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-paper px-6 py-12 text-center">
      <p className="font-serif text-[12px] tracking-[0.3em] text-mute uppercase">403 Forbidden</p>
      <h1 className="font-serif text-3xl tracking-tight text-ink">这里没有你的位置</h1>
      <p className="max-w-sm text-sm text-mute">
        登录成功，但当前账号不在管理员白名单。
        <br />
        如果你是团队成员，请联系管理员把你加进白名单。
      </p>
      <div className="flex items-center gap-3 pt-2">
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-xl border border-hairline px-5 py-2 text-[13px] text-mute transition hover:border-hairline-strong hover:text-ink"
          >
            登出并返回登录页
          </button>
        </form>
        <Link
          href="/"
          className="rounded-xl bg-ink px-5 py-2 text-[13px] text-paper transition hover:bg-ink-soft"
        >
          返回首页
        </Link>
      </div>
    </main>
  );
}
