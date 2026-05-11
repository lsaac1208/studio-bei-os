import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { settings } from "@/db/schema";

/**
 * 站点配置 / 联系方式 / 通知开关 等都存在 settings 表（key-value）。
 * 业务层读时走该 helper；写时走 actions/settings.ts。
 */
export async function getSetting(key: string): Promise<string | null> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return row?.value ?? null;
}

export async function getSettings(keys: readonly string[]): Promise<Record<string, string>> {
  if (keys.length === 0) return {};
  const rows = await db
    .select()
    .from(settings)
    .where(inArray(settings.key, [...keys]));
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: new Date() },
    });
}

export async function getBooleanSetting(key: string, defaultValue = false): Promise<boolean> {
  const v = await getSetting(key);
  if (v === null) return defaultValue;
  return v === "true" || v === "1";
}
