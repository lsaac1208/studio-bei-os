import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, pgClient } from "./client";
import { account, settings, user } from "./schema";

/**
 * 首次部署 / 应急通道：创建管理员账号 + 默认 settings。
 *
 * 本地：dotenv -e .env.local -- tsx db/seed.ts
 * 生产：docker compose --profile seed run --rm seed
 *
 * 必填：ADMIN_EMAIL
 * 可选：ADMIN_INITIAL_PASSWORD（≥12 字符；不填则跳过密码设置）
 *      ADMIN_LARK_OPEN_ID（逗号分隔；只取第一个绑定到 user.larkOpenId）
 *
 * 关键修正：
 *   better-auth emailAndPassword 登录时校验的密码 hash 存于
 *   account 表（providerId='credential', accountId=email, password=hash），
 *   而不是 user.passwordHash 字段。所以这里走 auth.$context.password.hash
 *   生成 hash 并写入 account 表。user.passwordHash 列保留备用但不读。
 */
async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  const adminLarkOpenIdRaw = process.env.ADMIN_LARK_OPEN_ID ?? "";
  const firstLarkOpenId = adminLarkOpenIdRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)[0];

  if (!adminEmail) {
    console.error("ADMIN_EMAIL is required");
    process.exit(1);
  }

  // 1. user 表
  const [existing] = await db.select().from(user).where(eq(user.email, adminEmail)).limit(1);

  let adminUserId: string;
  if (existing) {
    adminUserId = existing.id;
    console.info(`  user already exists: ${adminEmail} (id=${adminUserId.slice(0, 8)}…)`);

    // 同步 lark_open_id（如果 .env 里有但 user 表里没）
    if (firstLarkOpenId && !existing.larkOpenId) {
      await db.update(user).set({ larkOpenId: firstLarkOpenId }).where(eq(user.id, adminUserId));
      console.info(`  ↪ synced larkOpenId from env`);
    }
  } else {
    const [created] = await db
      .insert(user)
      .values({
        email: adminEmail,
        emailVerified: true,
        name: "Admin",
        larkOpenId: firstLarkOpenId ?? null,
        role: "admin",
      })
      .returning();
    adminUserId = created.id;
    console.info(`✓ created admin user: ${adminEmail} (id=${adminUserId.slice(0, 8)}…)`);
  }

  // 2. credential account（应急密码登录）
  if (adminPassword) {
    if (adminPassword.length < 12) {
      console.error("ADMIN_INITIAL_PASSWORD must be at least 12 characters");
      process.exit(1);
    }

    // 通过 better-auth 上下文获取与登录校验一致的 hash 算法
    const ctx = await auth.$context;
    const hash = await ctx.password.hash(adminPassword);

    const [existingAcct] = await db
      .select()
      .from(account)
      .where(and(eq(account.providerId, "credential"), eq(account.userId, adminUserId)))
      .limit(1);

    if (existingAcct) {
      await db.update(account).set({ password: hash }).where(eq(account.id, existingAcct.id));
      console.info(`✓ updated credential password for: ${adminEmail}`);
    } else {
      await db.insert(account).values({
        accountId: adminEmail,
        providerId: "credential",
        userId: adminUserId,
        password: hash,
      });
      console.info(`✓ created credential account for: ${adminEmail}`);
    }
  } else {
    console.info("  (no ADMIN_INITIAL_PASSWORD set — skipped credential creation)");
  }

  // 3. 默认 settings
  const defaults: Array<[string, string]> = [
    ["site.title", "Studio Bei"],
    ["site.description", "把生意里的预约、订单、库存、客户从混乱中接出来。"],
    ["contact.promiseHours", "24"],
    ["auth.allowPasswordFallback", "false"],
  ];

  for (const [key, value] of defaults) {
    await db.insert(settings).values({ key, value }).onConflictDoNothing({ target: settings.key });
  }
  console.info(`✓ seeded ${defaults.length} default settings`);

  console.info("\n✓ seed completed");
}

main()
  .then(async () => {
    await pgClient.end({ timeout: 5 });
  })
  .catch(async (err) => {
    console.error(err);
    await pgClient.end({ timeout: 5 }).catch(() => {});
    process.exitCode = 1;
  });
