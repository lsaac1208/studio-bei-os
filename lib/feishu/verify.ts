import { createHmac } from "node:crypto";

/**
 * 校验飞书卡片回调签名（X-Lark-Signature）。
 * 详细规则参考飞书开放平台文档 — `card_callback_v2` 验签。
 *
 * v1：基于 timestamp + nonce + body 的 sha256 HMAC。
 * 启用加密（FEISHU_ENCRYPT_KEY）时另需 AES 解密 payload.encrypt 字段。
 */
export async function verifyFeishuCallback(req: Request): Promise<unknown> {
  const body = await req.text();
  const signature = req.headers.get("X-Lark-Signature") ?? "";
  const timestamp = req.headers.get("X-Lark-Request-Timestamp") ?? "";
  const nonce = req.headers.get("X-Lark-Request-Nonce") ?? "";
  const token = process.env.FEISHU_VERIFICATION_TOKEN ?? "";

  if (token) {
    const expected = createHmac("sha256", token)
      .update(`${timestamp}${nonce}${body}`)
      .digest("hex");
    if (expected !== signature) {
      throw new Error("Invalid Feishu signature");
    }
  }

  const payload = JSON.parse(body) as Record<string, unknown>;
  // TODO: 启用加密时 AES-256-CBC 解密 payload.encrypt
  return payload;
}
