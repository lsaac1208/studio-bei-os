import { NextResponse } from "next/server";
import { getCurrentSession, isAdminAllowed } from "@/lib/auth-server";
import { uploadBlob } from "@/lib/blob";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
]);

const ALLOWED_NAMESPACES = new Set([
  "cases-cover",
  "cases-gallery",
  "cases-body",
  "settings-qrcode",
]);

/**
 * POST /api/upload
 *
 * Body: multipart/form-data
 *   - file:       File (≤ 5MB, image MIME)
 *   - namespace:  enum 见 ALLOWED_NAMESPACES（决定路径前缀）
 *   - slug?:      可选，与 cases-* namespace 配合用
 *
 * 仅 admin 可调用。
 *
 * 响应 { ok: true, url, pathname, size, contentType }
 */
export async function POST(req: Request) {
  // 鉴权
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  }
  if (!isAdminAllowed(session.user)) {
    return NextResponse.json({ ok: false, error: "无权限" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "请求体不是 multipart/form-data" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  const namespace = String(formData.get("namespace") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "缺少 file 字段" }, { status: 400 });
  }
  if (!ALLOWED_NAMESPACES.has(namespace)) {
    return NextResponse.json({ ok: false, error: "namespace 非法" }, { status: 400 });
  }
  if (file.size <= 0) {
    return NextResponse.json({ ok: false, error: "空文件" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: `文件过大（最多 ${MAX_BYTES / 1024 / 1024} MB）` },
      { status: 413 },
    );
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { ok: false, error: `不支持的 MIME 类型：${file.type || "未知"}` },
      { status: 415 },
    );
  }

  // 路径前缀：cases/[slug]/cover-{name} / cases/[slug]/gallery-{name} ...
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase();
  const safeSlug = /^[a-z0-9-]{1,64}$/.test(slug) ? slug : "_misc";
  const stamp = Date.now();
  let pathname: string;
  switch (namespace) {
    case "cases-cover":
      pathname = `cases/${safeSlug}/cover-${stamp}.${ext}`;
      break;
    case "cases-gallery":
      pathname = `cases/${safeSlug}/gallery-${stamp}.${ext}`;
      break;
    case "cases-body":
      pathname = `cases/${safeSlug}/body-${stamp}.${ext}`;
      break;
    case "settings-qrcode":
      pathname = `settings/qrcode-${stamp}.${ext}`;
      break;
    default:
      pathname = `uploads/${stamp}.${ext}`;
  }

  // 必须配置 BLOB_READ_WRITE_TOKEN
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "服务端未配置 BLOB_READ_WRITE_TOKEN" },
      { status: 500 },
    );
  }

  try {
    const result = await uploadBlob(file, { pathname, contentType: file.type });
    return NextResponse.json({
      ok: true as const,
      url: result.url,
      pathname: result.pathname,
      size: file.size,
      contentType: file.type,
    });
  } catch (err) {
    console.error("[/api/upload] put failed", err);
    return NextResponse.json({ ok: false, error: "上传失败" }, { status: 500 });
  }
}
