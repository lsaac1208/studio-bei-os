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

export default function Home() {
  return (
    <div className="min-h-dvh bg-paper text-ink">
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
