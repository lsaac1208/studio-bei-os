import * as lark from "@larksuiteoapi/node-sdk";

/**
 * 飞书 SDK 客户端（懒加载）。
 * 仅服务端使用（Server Action / Route Handler / 脚本）。
 * 没配置 FEISHU_APP_ID/SECRET 时延迟到实际调用才抛错，避免 build 时无关警告。
 */
let _client: lark.Client | null = null;

export function getFeishuClient(): lark.Client {
  if (_client) return _client;
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("FEISHU_APP_ID / FEISHU_APP_SECRET not configured");
  }
  _client = new lark.Client({
    appId,
    appSecret,
    domain: lark.Domain.Feishu, // 海外 Lark 用户改 lark.Domain.Lark
    loggerLevel: lark.LoggerLevel.warn,
  });
  return _client;
}

/**
 * 兼容旧调用方的 proxy：feishuClient.im.message.create(...)
 * 任何属性访问都会触发懒初始化。
 */
export const feishuClient = new Proxy({} as lark.Client, {
  get(_t, prop, _receiver) {
    return Reflect.get(getFeishuClient() as object, prop);
  },
});

export { lark };
