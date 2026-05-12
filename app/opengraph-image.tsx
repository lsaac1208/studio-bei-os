import { ImageResponse } from "next/og";

/**
 * 全站默认 Open Graph 图。
 *
 * Next 16 文件约定：所有没有自己 og:image 的页面，分享时都会用这张图
 * （cases/[slug] 有自己的 cover，不会受影响）。
 *
 * 设计原则：
 *  - 纯拉丁字符 —— Satori 默认不带中文字体，加载思源会让 build 慢且 image
 *    size 暴增。中文版本的 title/description 已经在 metadata 里，分享卡片
 *    用英文 hero 图视觉更稳。
 *  - 视觉与官网一致：paper 底色 + ink 字色 + 一行 studio-1 主色强调。
 */

export const alt = "Studio Bei — Make your business run on systems you can see, edit, and extend";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "#FAFAF7",
        color: "#0A0A0A",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      }}
    >
      {/* top: brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            background: "#E84A3B",
          }}
        />
        <span
          style={{
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#6B6B66",
            fontWeight: 600,
          }}
        >
          STUDIO BEI · 100yse.com
        </span>
      </div>

      {/* middle: headline */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            fontSize: 96,
            lineHeight: 1.04,
            letterSpacing: -3,
            fontWeight: 800,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Make your business</span>
          <span>
            run on systems&nbsp;
            <span style={{ color: "#E84A3B", fontStyle: "italic", fontWeight: 700 }}>
              you can see.
            </span>
          </span>
        </div>
        <div
          style={{
            fontSize: 28,
            lineHeight: 1.4,
            color: "#3D3D38",
            maxWidth: 900,
          }}
        >
          A one-person full-stack studio. Bookings, orders, inventory, B2B inquiries — running on
          systems you can edit and extend.
        </div>
      </div>

      {/* bottom: services strip */}
      <div
        style={{
          display: "flex",
          gap: 28,
          fontSize: 20,
          color: "#6B6B66",
          fontWeight: 500,
          letterSpacing: 0.5,
        }}
      >
        <span>Bookings</span>
        <span>·</span>
        <span>Orders &amp; Inventory</span>
        <span>·</span>
        <span>B2B Inquiries</span>
        <span>·</span>
        <span>CRM</span>
      </div>
    </div>,
    { ...size },
  );
}
