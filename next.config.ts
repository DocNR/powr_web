import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin requests from local network IP for iOS testing
  allowedDevOrigins: ['192.168.6.90:3000', '192.168.6.90:3001'],
  
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
