import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { genericOAuth } from "better-auth/plugins";
import { db } from "@/db/client";

/**
 * Better Auth 实例。
 *
 * 主登录：飞书 OAuth（genericOAuth 插件）。
 * 应急通道：邮箱密码登录（disableSignUp=true，仅 db:seed 创建的账号能登）。
 * 白名单：登录后由 lib/auth-server.ts 的 requireAdmin / isAdminAllowed 二次校验
 *        env ADMIN_EMAIL / ADMIN_LARK_OPEN_ID 是真权威，db.user.role 仅参考。
 *
 * 注：
 * - drizzleAdapter 会读取 db.schema 中的 user / session / account / verification 四张表
 * - additionalFields 让 better-auth 知晓我们的 lark/role 扩展字段
 * - 飞书 user_info 端点返回 { open_id, union_id, name, avatar_url, email? }
 */
const isProduction = process.env.NODE_ENV === "production";

const trustedOrigins = [
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.BETTER_AUTH_URL,
  "http://localhost:3000",
].filter((s): s is string => Boolean(s));

export const auth = betterAuth({
  appName: "Studio Bei OS",
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL,
  trustedOrigins,

  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  // 与 db/schema.ts 的 user 表扩展字段同步
  // - input:false    → 禁止从 sign-up form / API 写入（防御提权）
  // - returned:false → 从 API 响应中过滤（passwordHash 这类密码哈希必须设）
  // larkOpenId / role 是非敏感的标识符，要让 server-side getSession() 能拿到
  // 用于 isAdminAllowed 白名单校验
  user: {
    additionalFields: {
      passwordHash: { type: "string", required: false, input: false, returned: false },
      larkOpenId: { type: "string", required: false, input: false },
      larkUnionId: { type: "string", required: false, input: false },
      larkTenantKey: { type: "string", required: false, input: false },
      role: { type: "string", required: false, defaultValue: "admin", input: false },
    },
  },

  // 应急密码：登录开放，注册关闭（账号仅可通过 db:seed 创建）
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    autoSignIn: true,
    requireEmailVerification: false,
    minPasswordLength: 12,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 天
    updateAge: 60 * 60 * 24, // 1 天内活跃才滚动续期
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 分钟内复用 cookie 中的 session 数据，少打 db
    },
  },

  advanced: {
    cookiePrefix: "studio-bei",
    defaultCookieAttributes: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
    },
  },

  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "feishu",
          clientId: process.env.FEISHU_APP_ID ?? "",
          clientSecret: process.env.FEISHU_APP_SECRET ?? "",
          authorizationUrl: "https://open.feishu.cn/open-apis/authen/v1/authorize",
          tokenUrl: "https://open.feishu.cn/open-apis/authen/v2/oauth/token",
          userInfoUrl: "https://open.feishu.cn/open-apis/authen/v1/user_info",
          scopes: ["contact:user.id:readonly", "contact:user.base:readonly"],
          mapProfileToUser: (profile: Record<string, unknown>) => {
            const openId = (profile.open_id as string | undefined) ?? "";
            const unionId = (profile.union_id as string | undefined) ?? "";
            const tenantKey = (profile.tenant_key as string | undefined) ?? "";
            const fallbackEmail = `${unionId || openId || "anon"}@feishu.local`;
            return {
              email: (profile.email as string | undefined) || fallbackEmail,
              emailVerified: Boolean(profile.email),
              name: (profile.name as string | undefined) ?? "Admin",
              image: profile.avatar_url as string | undefined,
              // 写入扩展字段；由 layout 层做白名单校验
              larkOpenId: openId || undefined,
              larkUnionId: unionId || undefined,
              larkTenantKey: tenantKey || undefined,
            };
          },
        },
      ],
    }),
  ],
});

export type AuthInstance = typeof auth;
export type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
export type AuthUser = AuthSession["user"];
