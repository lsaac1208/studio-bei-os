import { type PutBlobResult, put } from "@vercel/blob";

/**
 * 上传文件到 Vercel Blob（公开访问）。
 * Server-only。客户端走 /api/upload Route Handler。
 */
export async function uploadBlob(
  file: File | Blob,
  opts?: { pathname?: string; contentType?: string },
): Promise<PutBlobResult> {
  const fileName = (file as File).name ?? "blob";
  const pathname = opts?.pathname ?? `uploads/${Date.now()}-${fileName}`;
  return await put(pathname, file, {
    access: "public",
    contentType: opts?.contentType ?? (file as File).type,
    addRandomSuffix: true,
  });
}
