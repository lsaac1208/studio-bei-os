import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://100yse.com";
const SITE_NAME = "Studio Bei";
const SITE_DESCRIPTION =
  "把生意里的预约、订单、库存、客户从混乱中接出来，跑在能看见、能修改、能延展的小系统上。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Studio Bei — 让线索、预约、订单、库存跑在能用的系统上",
    template: "%s | Studio Bei",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Studio Bei" }],
  creator: "Studio Bei",
  publisher: "Studio Bei",
  keywords: [
    "全栈开发",
    "独立开发",
    "工作室",
    "小程序定制",
    "网站定制",
    "预约系统",
    "订单系统",
    "库存系统",
    "官网询盘",
    "CRM",
    "Next.js",
    "freelance",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Studio Bei — 让线索、预约、订单、库存跑在能用的系统上",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Studio Bei",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-dvh font-sans antialiased">
        {children}
        <Toaster
          position="bottom-center"
          duration={2200}
          toastOptions={{
            classNames: {
              toast:
                "!bg-ink !text-paper !border-0 !rounded-xl !font-sans !text-[13px] !shadow-[0_18px_36px_rgba(14,16,20,0.18)]",
              title: "!font-medium",
            },
          }}
        />
      </body>
    </html>
  );
}
