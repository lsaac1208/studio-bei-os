import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { leads } from "@/db/schema";
import { changeLeadPriorityInternal, changeLeadStatusInternal } from "@/lib/leads-mutations";
import { renderNewLeadCard } from "./cards";

const ACTOR = "feishu_card";

/**
 * 卡片按钮 value 的统一形状：{ action, leadId, ...payload }
 * 处理后返回新的卡片 JSON，飞书会用它替换原消息（"toast" + auto re-render）。
 */
export async function handleCardAction(
  raw: unknown,
): Promise<{ toast?: { type: "info" | "success" | "error"; content: string }; card?: unknown }> {
  if (!isCardActionPayload(raw)) {
    return { toast: { type: "error", content: "无效的按钮参数" } };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    switch (raw.action) {
      case "contacted": {
        await changeLeadStatusInternal(raw.leadId, "CONTACTED", ACTOR);
        const lead = await getLeadOrThrow(raw.leadId);
        return {
          toast: { type: "success", content: "已标记为「已联系」" },
          card: renderNewLeadCard(lead, baseUrl),
        };
      }
      case "prioritize": {
        await changeLeadPriorityInternal(raw.leadId, "HIGH", ACTOR);
        const lead = await getLeadOrThrow(raw.leadId);
        return {
          toast: { type: "success", content: "优先级已设为「高」" },
          card: renderNewLeadCard(lead, baseUrl),
        };
      }
      default:
        return {
          toast: {
            type: "error",
            content: `未知操作 ${String((raw as { action: string }).action)}`,
          },
        };
    }
  } catch (err) {
    console.error("[feishu/handle-action] failed", err);
    return {
      toast: {
        type: "error",
        content: err instanceof Error ? err.message : "操作失败",
      },
    };
  }
}

function isCardActionPayload(raw: unknown): raw is { action: string; leadId: string } {
  if (typeof raw !== "object" || raw === null) return false;
  const r = raw as Record<string, unknown>;
  return typeof r.action === "string" && typeof r.leadId === "string";
}

async function getLeadOrThrow(id: string) {
  const [row] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!row) throw new Error("线索不存在");
  return row;
}
