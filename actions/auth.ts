"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * 退出登录：清除 session cookie + 服务端 revoke。
 * 用法：<form action={signOutAction}><button type="submit">登出</button></form>
 */
export async function signOutAction() {
  await auth.api.signOut({
    headers: await headers(),
  });
  redirect("/admin/login");
}
