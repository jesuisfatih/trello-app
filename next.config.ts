import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  
  experimental: {
    turbopack: {},
  },

  transpilePackages: [],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        protocol: 'https',
        hostname: 'trello.com',
      },
      {
        protocol: 'https',
        hostname: '**.trellocdn.com',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
