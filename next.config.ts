import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Vercel deployment: jangan pakai "standalone" (itu untuk Docker/self-hosted)
  // Vercel auto-handles output optimization

  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Supabase client uses some Node.js APIs that need to be externalized
  experimental: {
    serverComponentsExternalPackages: ["@supabase/supabase-js"],
  },
};

export default nextConfig;
