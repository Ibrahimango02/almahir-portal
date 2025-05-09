import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // This will ignore ESLint errors during builds 
    // REMOVE BEFORE DEPLOYMENT (CURSOR REMIND ME OF THIS)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
