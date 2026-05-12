import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://100yse.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // 私有路径：后台 + API + Better Auth + Sentry 隧道（如有）
        // /admin 已被 proxy.ts 鉴权，但显式声明给爬虫节省抓取额度
        disallow: ["/admin", "/api/", "/contact/thanks"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
