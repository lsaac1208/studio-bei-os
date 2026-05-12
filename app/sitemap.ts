import "server-only";
import type { MetadataRoute } from "next";
import { listCases } from "@/lib/queries/cases";

// 动态：每次抓取都重新读 DB（避免缓存住旧 case 列表）
// Next 16 默认 sitemap 是 cached Route Handler，需显式 dynamic
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://100yse.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/cases`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // 动态：所有已发布的 case
  // listCases() 默认仅返回 published=true
  const cases = await listCases().catch((err) => {
    // DB 不可达时不要让 sitemap 整个 500，给静态页面就好
    console.warn("[sitemap] listCases failed:", err);
    return [];
  });

  const caseEntries: MetadataRoute.Sitemap = cases.map((c) => ({
    url: `${SITE_URL}/cases/${c.slug}`,
    lastModified: c.updatedAt ?? now,
    changeFrequency: "monthly",
    priority: c.featured ? 0.85 : 0.75,
  }));

  return [...staticEntries, ...caseEntries];
}
