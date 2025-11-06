import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  
  experimental: {
    ppr: false,
    staticGenerationOptions: {
      autoPrerender: false,
    },
  },

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
    ],
  },
};

export default nextConfig;
