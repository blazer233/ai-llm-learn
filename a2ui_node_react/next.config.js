/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  env: {
    HUNYUAN_API_KEY: process.env.HUNYUAN_API_KEY,
    HUNYUAN_BASE_URL: process.env.HUNYUAN_BASE_URL,
  },
};

module.exports = nextConfig;
