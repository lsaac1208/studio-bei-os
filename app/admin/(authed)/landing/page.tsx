import type { Metadata } from "next";
import { FitSection } from "@/components/admin/landing/FitSection";
import { PricingSection } from "@/components/admin/landing/PricingSection";
import { ProcessSection } from "@/components/admin/landing/ProcessSection";
import { ServiceSection } from "@/components/admin/landing/ServiceSection";
import type {
  LandingFitData,
  LandingPricingData,
  LandingProcessData,
  LandingServiceData,
} from "@/db/schema";
import { listLandingBlocks } from "@/lib/queries/landing";

export const metadata: Metadata = { title: "首页内容 · 管理" };

// 内容很轻，但调用 4 次 DB；首页编辑后立即刷新，标记为动态
export const dynamic = "force-dynamic";

export default async function AdminLandingPage() {
  const [services, pricing, process, fitGood, fitNot] = await Promise.all([
    listLandingBlocks("service", { includeUnpublished: true }),
    listLandingBlocks("pricing", { includeUnpublished: true }),
    listLandingBlocks("process", { includeUnpublished: true }),
    listLandingBlocks("fit_good", { includeUnpublished: true }),
    listLandingBlocks("fit_not", { includeUnpublished: true }),
  ]);

  return (
    <div className="space-y-12">
      <header>
        <h1 className="font-serif text-2xl tracking-tight text-ink sm:text-3xl">首页内容</h1>
        <p className="mt-1 max-w-3xl text-[13px] text-mute leading-relaxed">
          在这里编辑首页的「服务套餐 / 报价档位 / 合作流程 / 适合 &amp; 不适合」四个区块。
          数据库为空时，前端会回退到代码里的默认内容；首次部署后请用「恢复默认」一次性导入到 DB。
        </p>
      </header>

      <ServiceSection
        items={services.map((b) => ({
          id: b.id,
          published: b.published,
          data: b.data as LandingServiceData,
        }))}
      />

      <PricingSection
        items={pricing.map((b) => ({
          id: b.id,
          published: b.published,
          data: b.data as LandingPricingData,
        }))}
      />

      <ProcessSection
        items={process.map((b) => ({
          id: b.id,
          published: b.published,
          data: b.data as LandingProcessData,
        }))}
      />

      <FitSection
        good={fitGood.map((b) => ({
          id: b.id,
          published: b.published,
          data: b.data as LandingFitData,
        }))}
        not={fitNot.map((b) => ({
          id: b.id,
          published: b.published,
          data: b.data as LandingFitData,
        }))}
      />
    </div>
  );
}
