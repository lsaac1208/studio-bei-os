import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { type AuthSession, auth } from "./auth";

/**
 * 服务端鉴权工具集合（admin layout / pages / server actions / API route 都用这个）。
 *
 * 白名单权威来源：env
 *   ADMIN_EMAIL              单个邮箱，应急密码登录主用
 *   ADMIN_LARK_OPEN_ID       逗号分隔多个 lark_open_id，飞书登录主用
 *
 * db.user.role 不作为权威，因为它是 default "admin"，新建任何 user 都是 admin。
 */
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const ADMIN_LARK_OPEN_IDS = (process.env.ADMIN_LARK_OPEN_ID ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * 当前会话；未登录返回 null。
 */
export async function getCurrentSession(): Promise<AuthSession | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/**
 * 仅做"已登录"判断，未登录则跳 /admin/login。
 * 不做白名单校验。
 */
export async function requireSession(): Promise<AuthSession> {
  const s = await getCurrentSession();
  if (!s) {
    redirect("/admin/login");
  }
  return s;
}

/**
 * 是否在管理员白名单（env 权威）。
 *
 * 接受 unknown 参数 + runtime 类型守卫，是为了兼容 better-auth 1.6.x 的
 * AuthUser 类型推导：additionalFields（larkOpenId 等）不会出现在静态类型里，
 * 但运行时 session.user 上确实有这些字段。
 */
export function isAdminAllowed(user: unknown): boolean {
  if (!user || typeof user !== "object") return false;
  const u = user as { email?: unknown; larkOpenId?: unknown };

  const email = typeof u.email === "string" ? u.email.toLowerCase() : null;
  const larkOpenId = typeof u.larkOpenId === "string" ? u.larkOpenId : null;

  // 邮箱白名单（应急密码登录走这条）
  if (ADMIN_EMAIL && email && email === ADMIN_EMAIL) return true;
  // 飞书白名单（飞书登录走这条）
  if (larkOpenId && ADMIN_LARK_OPEN_IDS.includes(larkOpenId)) return true;
  return false;
}

/**
 * Layout / Page / Server Action 用：必须是 admin。
 *  - 未登录 → /admin/login
 *  - 已登录但非白名单 → /admin/forbidden
 */
export async function requireAdmin(): Promise<AuthSession> {
  const session = await requireSession();
  if (!isAdminAllowed(session.user)) {
    redirect("/admin/forbidden");
  }
  return session;
}
