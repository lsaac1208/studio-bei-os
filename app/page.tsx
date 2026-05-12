import { CaseHengyue } from "@/components/cases/hengyue/CaseHengyue";
import { CaseMailab } from "@/components/cases/mailab/CaseMailab";
import { CaseQiguang } from "@/components/cases/qiguang/CaseQiguang";
import { Contact } from "@/components/marketing/Contact";
import { Faq } from "@/components/marketing/Faq";
import { Fit } from "@/components/marketing/Fit";
import { Footer } from "@/components/marketing/Footer";
import { Hero } from "@/components/marketing/Hero";
import { Pricing } from "@/components/marketing/Pricing";
import { Process } from "@/components/marketing/Process";
import { Services } from "@/components/marketing/Services";
import { Topbar } from "@/components/marketing/Topbar";
import { TrustStrip } from "@/components/marketing/TrustStrip";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://100yse.com";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Studio Bei",
      description:
        "把生意里的预约、订单、库存、客户从混乱中接出来，跑在能看见、能修改、能延展的小系统上。",
      inLanguage: "zh-CN",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": ["Organization", "ProfessionalService"],
      "@id": `${SITE_URL}/#organization`,
      name: "Studio Bei",
      alternateName: ["百业", "百业 Studio", "Studio 百业"],
      url: SITE_URL,
      description:
        "一人全栈工作室，帮中小商家把预约、订单、库存、官网询盘从混乱里接出来，跑在能看见、能修改、能延展的业务系统上。",
      areaServed: [
        { "@type": "Country", name: "中国大陆" },
        { "@type": "Place", name: "港澳台" },
        { "@type": "Place", name: "海外（中文沟通）" },
      ],
      serviceType: [
        "本地服务在线预约系统",
        "电商作坊订单库存系统",
        "B2B 工厂官网询盘",
        "诊所/工作室客户管理 CRM",
        "全栈业务系统定制",
        "小程序开发",
        "网站定制",
      ],
      knowsAbout: [
        "Next.js",
        "TypeScript",
        "Postgres",
        "Drizzle ORM",
        "微信小程序",
        "飞书集成",
        "业务系统集成",
        "CRM",
      ],
      slogan: "让线索、预约、订单、库存跑在能用的系统上",
    },
  ],
};

export default function Home() {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: schema.org JSON-LD
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Topbar />
      <main id="top" className="relative z-[1]">
        <Hero />
        <TrustStrip />
        <CaseQiguang />
        <CaseMailab />
        <CaseHengyue />
        <Services />
        <Pricing />
        <Process />
        <Fit />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
