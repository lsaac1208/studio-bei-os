"use client";

import { useState } from "react";

export interface UploadResult {
  url: string;
  pathname: string;
  size: number;
  contentType: string;
}

interface UploadOpts {
  namespace: "cases-cover" | "cases-gallery" | "cases-body" | "settings-qrcode";
  slug?: string;
}

/**
 * 统一的图片上传 hook：
 *  - busy：上传中
 *  - upload(file)：执行上传，成功返回 UploadResult，失败抛错（外层 toast）
 */
export function useImageUpload() {
  const [busy, setBusy] = useState(false);

  const upload = async (file: File, opts: UploadOpts): Promise<UploadResult> => {
    if (busy) throw new Error("上一次上传还没完成");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("namespace", opts.namespace);
      if (opts.slug) fd.append("slug", opts.slug);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = (await res.json()) as
        | { ok: true; url: string; pathname: string; size: number; contentType: string }
        | { ok: false; error: string };
      if (!res.ok || !("ok" in json) || !json.ok) {
        const msg = "error" in json ? json.error : `HTTP ${res.status}`;
        throw new Error(msg);
      }
      return {
        url: json.url,
        pathname: json.pathname,
        size: json.size,
        contentType: json.contentType,
      };
    } finally {
      setBusy(false);
    }
  };

  return { busy, upload };
}
