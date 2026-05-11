import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { BusinessType, LeadStatus } from "@/db/schema";
import { getCurrentSession, isAdminAllowed } from "@/lib/auth-server";
import { leadsToCSV } from "@/lib/csv";
import { BUSINESS_TYPE_OPTIONS, LEAD_STATUS_OPTIONS } from "@/lib/lead-options";
import { EXPORT_HARD_LIMIT, listLeadsForExport } from "@/lib/queries/leads";

// 不缓存，每次实时查询
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/leads/export?status=NEW&businessType=APPOINTMENT&q=...
 * 鉴权：必须是 admin 白名单（与 /admin/* 一致）
 * 输出：text/csv; charset=utf-8 with BOM, attachment
 */
export async function GET(req: NextRequest) {
  // 1) 鉴权（API 不能 redirect，直接 401/403 给前端处理）
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  if (!isAdminAllowed(session.user)) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }

  // 2) 解析过滤
  const sp = req.nextUrl.searchParams;
  const validStatuses = LEAD_STATUS_OPTIONS.map((o) => o.value) as readonly string[];
  const validBizTypes = BUSINESS_TYPE_OPTIONS.map((o) => o.value) as readonly string[];

  const rawStatus = sp.get("status");
  const status =
    rawStatus && validStatuses.includes(rawStatus) ? (rawStatus as LeadStatus) : undefined;

  const rawBiz = sp.get("businessType");
  const businessType =
    rawBiz && validBizTypes.includes(rawBiz) ? (rawBiz as BusinessType) : undefined;

  const q = sp.get("q")?.trim() || undefined;

  // 3) 查询 + 序列化
  const { rows, truncated } = await listLeadsForExport({ status, businessType, q });
  const csv = leadsToCSV(rows);

  // 4) 文件名：YYYYMMDD-HHmm（北京时间）
  const z = new Date(Date.now() + 8 * 3600 * 1000);
  const stamp =
    `${z.getUTCFullYear()}${String(z.getUTCMonth() + 1).padStart(2, "0")}` +
    `${String(z.getUTCDate()).padStart(2, "0")}-${String(z.getUTCHours()).padStart(2, "0")}` +
    `${String(z.getUTCMinutes()).padStart(2, "0")}`;
  const filename = `leads-${stamp}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-Row-Count": String(rows.length),
      ...(truncated ? { "X-Truncated": String(EXPORT_HARD_LIMIT) } : {}),
    },
  });
}
