import "server-only";
import pino from "pino";

/**
 * 服务器端结构化日志。
 *
 * 生产：JSON 行输出 → docker logs → journald；下游用 `jq` / loki / vector 切片检索
 * 本地：也是 JSON 行，要阅读友好可 `pnpm dev | pnpm exec pino-pretty`
 *
 * 敏感字段默认 redact：Authorization / Cookie / 任何 password 字段。
 *
 * 用法：
 *  import { logger, scopedLogger } from "@/lib/logger";
 *
 *  logger.info({ leadId }, "new lead created");
 *
 *  const log = scopedLogger("bitable-sync");
 *  log.warn({ err, leadId }, "push failed");
 *
 *  log.error(err);  // pino 自动序列化 Error，包含 message + stack
 */
const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
  // 敏感字段屏蔽；生产不写 Authorization / Cookie 到日志
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.passwordHash",
      "password",
      "passwordHash",
      "FEISHU_APP_SECRET",
      "FEISHU_VERIFICATION_TOKEN",
      "FEISHU_ENCRYPT_KEY",
      "BETTER_AUTH_SECRET",
      "CRON_SECRET",
      "BACKUP_ENCRYPT_PASSPHRASE",
    ],
    remove: true,
  },
  // 每条日志都带项目标识与版本
  base: {
    app: "studio-bei-os",
    version: process.env.APP_VERSION ?? "dev",
  },
  // Node 默认把 Error 当对象；pino 需要 serializers 才能保留 stack
  serializers: {
    err: pino.stdSerializers.err,
  },
  // 以毫秒时间戳为 time 字段，方便与 docker logs / Sentry 对齐
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * 创建一个绑定 scope 的子 logger，作为各子模块的约定。
 *
 *  const log = scopedLogger("bitable-sync");
 *  log.info("...")    // → { scope: "bitable-sync", ... }
 */
export function scopedLogger(scope: string) {
  return logger.child({ scope });
}
