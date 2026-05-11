import { NextResponse } from "next/server";
import { listFaqs } from "@/lib/queries/faq";

/**
 * 公开 FAQ 列表。
 * 只返回 published=true 的条目，按后台排序。
 */
export async function GET() {
  const items = await listFaqs();
  return NextResponse.json({
    ok: true,
    items: items.map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
    })),
  });
}

export const dynamic = "force-dynamic"; // settings / FAQ 变更后 revalidatePath 不覆盖 API 路由，强制动态
