import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin requests for mobile development
  allowedDevOrigins: ['192.168.6.90:3000', '192.168.6.90:3001', '192.168.6.90:3002'],
  
  // Enable experimental features for better mobile development
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons'],
  },
  
  // Configure headers for mobile development
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  
  async rewrites() {
    return [
      {
        // Handle Amber's no-slash callback format
        // /auth/callback3129509e... -> /auth/callback/3129509e...
        source: '/auth/callback:result(.*)',
        destination: '/auth/callback/:result',
      },
    ];
  },
};

export default nextConfig;
