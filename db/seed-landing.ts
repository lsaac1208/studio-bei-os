import { count, eq } from "drizzle-orm";
import {
  DEFAULT_FIT_GOOD,
  DEFAULT_FIT_NOT,
  DEFAULT_PRICING,
  DEFAULT_PROCESS,
  DEFAULT_SERVICES,
} from "@/lib/landing-defaults";
import { db, pgClient } from "./client";
import { type LandingBlockData, type LandingBlockKind, landingBlocks } from "./schema";

/**
 * 初始化首页内容块（Services / Pricing / Process / Fit Good / Fit Not）。
 *
 * 行为：
 *  - 按 kind 检查；该 kind 已存在任意行 → 跳过整组（避免覆盖用户后台修改过的内容）
 *  - 该 kind 行数为 0 → 批量插入 defaults
 *
 * 用法：
 *   本地：dotenv -e .env.local -- tsx db/seed-landing.ts
 *   生产：docker compose --profile seed-landing run --rm seed-landing
 *
 * 想重置某 kind → 先在后台删光，再跑这个 seed。
 */

interface SeedGroup {
  kind: LandingBlockKind;
  rows: LandingBlockData[];
}

const SEED: SeedGroup[] = [
  { kind: "service", rows: DEFAULT_SERVICES },
  { kind: "pricing", rows: DEFAULT_PRICING },
  { kind: "process", rows: DEFAULT_PROCESS },
  { kind: "fit_good", rows: DEFAULT_FIT_GOOD },
  { kind: "fit_not", rows: DEFAULT_FIT_NOT },
];

async function main() {
  let insertedGroups = 0;
  let insertedRows = 0;
  let skippedGroups = 0;

  for (const group of SEED) {
    const [{ n }] = await db
      .select({ n: count() })
      .from(landingBlocks)
      .where(eq(landingBlocks.kind, group.kind));
    if (Number(n) > 0) {
      skippedGroups += 1;
      console.info(`  skipped ${group.kind} (${n} rows already exist)`);
      continue;
    }
    const values = group.rows.map((data, i) => ({
      kind: group.kind,
      data,
      order: i,
      published: true,
    }));
    const inserted = await db
      .insert(landingBlocks)
      .values(values)
      .returning({ id: landingBlocks.id });
    insertedGroups += 1;
    insertedRows += inserted.length;
    console.info(`✓ inserted ${group.kind} (${inserted.length} rows)`);
  }

  console.info(
    `\n✓ seed-landing done: ${insertedGroups} groups / ${insertedRows} rows inserted, ${skippedGroups} groups skipped`,
  );
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
