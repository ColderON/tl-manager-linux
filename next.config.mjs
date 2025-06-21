/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  assetPrefix: process.env.NODE_ENV === 'production' ? './' : undefined,
  images: {
    unoptimized: true
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  }
};

export default nextConfig;
