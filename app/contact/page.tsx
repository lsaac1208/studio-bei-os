import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact/ContactForm";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://100yse.com";

const PAGE_DESCRIPTION =
  "现在怎么接单、记录、跟进，哪里最浪费人工，希望什么时候上线，预算大概在哪个区间。";

export const metadata: Metadata = {
  title: "把你的业务流程发给我",
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    url: "/contact",
    title: "把你的业务流程发给我 · Studio Bei",
    description: PAGE_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: "把你的业务流程发给我 · Studio Bei",
    description: PAGE_DESCRIPTION,
  },
};

const contactJsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  url: `${SITE_URL}/contact`,
  name: "把你的业务流程发给我 · Studio Bei",
  description: PAGE_DESCRIPTION,
  inLanguage: "zh-CN",
  isPartOf: { "@type": "WebSite", "@id": `${SITE_URL}/#website` },
  mainEntity: { "@type": "Organization", "@id": `${SITE_URL}/#organization` },
  potentialAction: {
    "@type": "CommunicateAction",
    name: "提交业务需求",
    target: `${SITE_URL}/contact`,
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: schema.org JSON-LD
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />
      <div className="mx-auto max-w-[820px] px-5 py-12 sm:px-8 lg:py-20">
        <header className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-mono text-[12px] text-mute uppercase tracking-[0.14em] transition-colors hover:text-ink"
          >
            ← Studio Bei
          </Link>

          <div className="mt-10">
            <span className="font-mono text-[11px] text-mute uppercase tracking-[0.14em]">
              Contact / 09
            </span>
            <h1 className="mt-3 mb-5 font-bold text-[clamp(40px,7vw,80px)] leading-[1] tracking-[-0.04em]">
              把<em className="font-serif font-semibold text-studio-1 italic">业务流程和卡点</em>
              <br />
              告诉我。
            </h1>
            <p className="max-w-[640px] text-[16px] text-ink-soft leading-[1.75]">
              你不需要一开始就写完整需求。只要告诉我：
              <strong className="text-ink">
                现在怎么接单、哪里最浪费人工、希望什么时候上线、预算大概在哪个区间
              </strong>
              ，我会判断先做哪一版最合适，并在 1 个工作日内回复。
            </p>
          </div>
        </header>

        <ContactForm />

        <footer className="mt-16 border-hairline border-t pt-6 text-[12px] text-mute">
          <span>
            © Studio Bei · 独立全栈开发者 ·
            <Link href="/" className="ml-1 underline-offset-2 hover:text-ink hover:underline">
              返回首页
            </Link>
          </span>
        </footer>
      </div>
    </div>
  );
}
