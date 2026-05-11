import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { requireAdmin } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: { default: "管理后台", template: "%s | Studio Bei 后台" },
  robots: { index: false, follow: false },
};

/**
 * 鉴权 layout —— 仅作用于 (authed) route group 内的子路径。
 * /admin/login 和 /admin/forbidden 不在此组，不会触发鉴权（避免 redirect 死循环）。
 */
export default async function AuthedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <AdminTopbar user={session.user} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
