import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Postgres 客户端
 * - 生产：连接池 max=10，适配单实例 Next.js + 自管 PG
 * - 开发：max=1，避免 HMR 反复重载导致连接堆积
 * - 全局单例：通过 globalThis 缓存，跨 dev 重载共享同一个池
 */
const connectionString = process.env.DATABASE_URL ?? "";

if (!connectionString && process.env.NODE_ENV !== "test") {
  console.warn(
    "[db] DATABASE_URL is not set. Copy .env.example to .env.local and fill in your Postgres URL.",
  );
}

declare global {
  var __studioBeiPgClient: ReturnType<typeof postgres> | undefined;
}

function makeClient() {
  return postgres(connectionString, {
    max: process.env.NODE_ENV === "production" ? 10 : 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
}

let client: ReturnType<typeof postgres>;
if (process.env.NODE_ENV === "production") {
  client = makeClient();
} else {
  if (!globalThis.__studioBeiPgClient) {
    globalThis.__studioBeiPgClient = makeClient();
  }
  client = globalThis.__studioBeiPgClient;
}

export const db = drizzle(client, {
  schema,
  casing: "snake_case",
});

// 为 db/seed.ts 等一次性脚本暴露底层连接，方便跑完后优雅关闭
export const pgClient = client;

export type Database = typeof db;
export { schema };
