import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    turbo: {
      loaders: {
        '.ts': ['ts-loader'],
        '.tsx': ['ts-loader'],
      },
    },
  },
};

export default nextConfig;
