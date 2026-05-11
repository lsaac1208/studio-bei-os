import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// 标准 Better Auth + Next App Router 集成。
// 暴露 GET / POST / OPTIONS 等所有 Better Auth 路由（sign-in、callback、get-session、sign-out 等）。
export const { GET, POST } = toNextJsHandler(auth);
