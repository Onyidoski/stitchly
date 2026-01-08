import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // REPLACE THIS with your R2 Public URL hostname (e.g. pub-12345.r2.dev or assets.stitchly.com)
        hostname: 'pub-2684b92cad7b4733a9f57ffcb87edd9c.r2.dev', 
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;