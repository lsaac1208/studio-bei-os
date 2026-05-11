import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Studio Bei — 让线索、预约、订单、库存跑在能用的系统上",
    template: "%s | Studio Bei",
  },
  description:
    "把生意里的预约、订单、库存、客户从混乱中接出来，跑在能看见、能修改、能延展的小系统上。",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
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
