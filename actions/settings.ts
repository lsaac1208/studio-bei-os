"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { settings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-server";
import { SETTING_KEYS } from "@/lib/settings-keys";

/**
 * 批量更新站点设置。
 *
 * 安全：
 *   - requireAdmin
 *   - key 必须在白名单 SETTING_KEYS 内（其他 key 静默忽略）
 *   - value trim 后为空则删除该 key（允许"清空"一个选项）
 *   - 单值最大长度 2000
 */
const RecordInput = z.record(z.string(), z.string().max(2000, "单项长度上限 2000"));

export async function updateSettings(input: Record<string, string>) {
  const parsed = RecordInput.parse(input);
  await requireAdmin();

  const entries = Object.entries(parsed).filter(([k]) => SETTING_KEYS.includes(k));
  if (entries.length === 0) {
    return { ok: true as const, updated: 0, cleared: 0 };
  }

  let updated = 0;
  let cleared = 0;

  await db.transaction(async (tx) => {
    for (const [key, raw] of entries) {
      const value = raw.trim();
      if (!value) {
        await tx.delete(settings).where(eq(settings.key, key));
        cleared += 1;
      } else {
        await tx
          .insert(settings)
          .values({ key, value })
          .onConflictDoUpdate({
            target: settings.key,
            set: { value, updatedAt: new Date() },
          });
        updated += 1;
      }
    }
  });

  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/contact");
  return { ok: true as const, updated, cleared };
}
