import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
