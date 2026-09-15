import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/orchestrator/:path*',
        destination: `${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:8002'}/:path*`
      },
      {
        source: '/api/worker/:path*',
        destination: `${process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8000'}/:path*`
      }
    ]
  }
};

export default nextConfig;
