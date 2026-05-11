import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 多阶段镜像：将运行时依赖打包进 .next/standalone
  output: "standalone",
  poweredByHeader: false,
  // 反代后真实 IP 通过 X-Forwarded-For 获取
  // 自管 Nginx → 127.0.0.1:13001 → Next.js
  experimental: {
    // serverActions 默认开启，无需配置
  },
};

export default nextConfig;
