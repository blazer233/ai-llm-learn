/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // Hunyuan 配置
    HUNYUAN_API_KEY: process.env.HUNYUAN_API_KEY,
    HUNYUAN_BASE_URL: process.env.HUNYUAN_BASE_URL,
  },
  // 开发环境优化
  productionBrowserSourceMaps: false,
  // 禁用开发时不必要的日志
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

module.exports = nextConfig;
