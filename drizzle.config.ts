import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  // drizzle-kit 命令必须能读到 DATABASE_URL；通过 dotenv-cli 加载
  // 例：pnpm dotenv -e .env.local -- pnpm db:generate
  console.warn("[drizzle] DATABASE_URL is not set. Use dotenv-cli or set in shell.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  casing: "snake_case",
  verbose: true,
  strict: true,
});
