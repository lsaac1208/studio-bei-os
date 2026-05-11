import { createDecipheriv, createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * 校验飞书回调（签名 + 可选 AES 解密）。
 *
 * 文档：飞书开放平台 → 应用 → 事件订阅 → 验签 / 加密。
 *
 * 两道闸：
 *  1. 签名：HMAC-SHA256(timestamp + nonce + raw_body, FEISHU_VERIFICATION_TOKEN)
 *     - 生产强制要求；NODE_ENV=production 且 token 缺失时 fail-fast，拒绝裸奔
 *     - 本地 dev 可不配，跳过校验便于演示
 *  2. 加密：AES-256-CBC，body 形如 { "encrypt": "<base64>" }
 *     - 飞书后台启用「加密推送」时使用
 *     - 收到加密 body 但未配 FEISHU_ENCRYPT_KEY → throw（避免静默放过）
 *
 * 注意：签名是对**原始 body**（加密时即密文）算的，所以签名校验必须在解密之前。
 */
const isProduction = process.env.NODE_ENV === "production";

export async function verifyFeishuCallback(req: Request): Promise<unknown> {
  const body = await req.text();
  const signature = req.headers.get("X-Lark-Signature") ?? "";
  const timestamp = req.headers.get("X-Lark-Request-Timestamp") ?? "";
  const nonce = req.headers.get("X-Lark-Request-Nonce") ?? "";
  const token = process.env.FEISHU_VERIFICATION_TOKEN ?? "";

  // R7: 生产环境必须配 token，否则拒绝处理（防止裸奔）
  if (isProduction && !token) {
    throw new Error(
      "FEISHU_VERIFICATION_TOKEN missing in production: refusing to process callback. Set the env or temporarily disable Feishu callback URL.",
    );
  }

  if (token) {
    const expected = createHmac("sha256", token)
      .update(`${timestamp}${nonce}${body}`)
      .digest("hex");
    if (!constantTimeEqualsHex(expected, signature)) {
      throw new Error("Invalid Feishu signature");
    }
  }

  // 解析 body：可能是明文 JSON 或 { encrypt }
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body) as Record<string, unknown>;
  } catch {
    throw new Error("Feishu callback body is not valid JSON");
  }

  // R8: 飞书启用加密推送时，body 是 { encrypt: <base64> }
  if (typeof payload.encrypt === "string") {
    const encryptKey = process.env.FEISHU_ENCRYPT_KEY ?? "";
    if (!encryptKey) {
      throw new Error(
        "Received encrypted Feishu payload but FEISHU_ENCRYPT_KEY is not set; configure the same key as in Feishu console or disable encryption there.",
      );
    }
    const decrypted = decryptFeishuPayload(payload.encrypt, encryptKey);
    return JSON.parse(decrypted) as Record<string, unknown>;
  }

  return payload;
}

/**
 * AES-256-CBC 解密飞书加密 payload。
 *
 * 飞书规则（v1）：
 *  - key   = sha256(FEISHU_ENCRYPT_KEY)            32 字节
 *  - 密文  = base64(IV || ciphertext)，IV 是头 16 字节
 *  - 算法  = aes-256-cbc，PKCS#7 padding（Node 默认 setAutoPadding=true）
 */
function decryptFeishuPayload(b64: string, encryptKey: string): string {
  const key = createHash("sha256").update(encryptKey).digest();
  const buf = Buffer.from(b64, "base64");
  if (buf.length < 32) {
    // 至少 16 字节 IV + 16 字节最小一个 AES block
    throw new Error("Feishu encrypted payload too short");
  }
  const iv = buf.subarray(0, 16);
  const ciphertext = buf.subarray(16);

  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}

/**
 * 常量时间比较两个 hex 字符串。避免短路比较泄露字节级信息。
 */
function constantTimeEqualsHex(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  // 解析失败时 Buffer 长度对不上，直接 false
  if (bufA.length !== bufB.length || bufA.length === 0) return false;
  return timingSafeEqual(bufA, bufB);
}
