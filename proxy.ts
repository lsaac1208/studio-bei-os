import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Next.js 16 Proxy（替代旧 middleware）
 * 仅做 cookie 存在性快速过滤；详细鉴权在 Server Component / Server Action 里调
 * `auth.api.getSession({ headers })`。
 *
 * 注意：cookiePrefix 必须与 lib/auth.ts 的 advanced.cookiePrefix 一致。
 * 不一致会导致 proxy 永远判定无 session → 所有 /admin 请求被错误地踢回 login。
 */
export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 后台路径但不是登录页 / forbidden 页 → 必须有会话 cookie
  // forbidden 页要让"已登录但非白名单"用户能进，所以这里也跳过 cookie 检查
  if (
    path.startsWith("/admin") &&
    !path.startsWith("/admin/login") &&
    !path.startsWith("/admin/forbidden")
  ) {
    const session = getSessionCookie(req, { cookiePrefix: "studio-bei" });
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("redirect", path);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
