import { type NextRequest, NextResponse } from "next/server";
import { handleCardAction } from "@/lib/feishu/handle-action";
import { verifyFeishuCallback } from "@/lib/feishu/verify";

/**
 * 飞书回调统一入口。
 * 飞书后台 → 应用功能 → 事件订阅 → 请求网址：
 *   https://100yse.com/api/feishu/callback
 *
 * 处理两类 payload：
 *   1) URL verification: { type: "url_verification", challenge }
 *      → 原样回 { challenge }
 *   2) 卡片交互：飞书 v2 标准 body 中 .action.value 携带 { action, leadId }
 *      → 路由到 handleCardAction，返回 { toast?, card? } 让飞书原地刷新卡片
 *
 * 签名校验：
 *   - 设置 FEISHU_VERIFICATION_TOKEN 后启用 HMAC-SHA256 校验
 *   - 未设置时跳过（仅本地 / 演示）
 *
 * 加密：
 *   - FEISHU_ENCRYPT_KEY 启用后 body 是 { encrypt } AES 密文，TODO 待解密
 */
export async function POST(req: NextRequest) {
  let payload: Record<string, unknown>;
  try {
    payload = (await verifyFeishuCallback(req)) as Record<string, unknown>;
  } catch (err) {
    console.error("[/api/feishu/callback] verify failed", err);
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  // URL 验证（订阅事件首次握手）
  if (payload.type === "url_verification" && typeof payload.challenge === "string") {
    return NextResponse.json({ challenge: payload.challenge });
  }

  // 卡片按钮回调
  // 飞书 v2 卡片 action 回调 body 形如：
  //   { action: { value: { action: "contacted", leadId: "..." }, tag, ... }, ... }
  const action =
    isObject(payload.action) && "value" in payload.action
      ? (payload.action as Record<string, unknown>).value
      : isObject(payload.event) && isObject((payload.event as Record<string, unknown>).action)
        ? ((payload.event as Record<string, unknown>).action as Record<string, unknown>).value
        : null;

  if (action) {
    const result = await handleCardAction(action);
    // 飞书允许在 response.body 中返回新 card 让对方原地刷新
    return NextResponse.json({
      toast: result.toast,
      card: result.card ? { type: "raw", data: result.card } : undefined,
    });
  }

  // 其他事件（im.message, application.bot.added 等）暂不处理
  return NextResponse.json({ ok: true });
}

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}
