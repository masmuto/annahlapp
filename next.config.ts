import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Catatan: Jangan pakai "output: standalone" (untuk Docker, bukan Vercel)
  // Vercel auto-handles output optimization

  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Note: serverComponentsExternalPackages dipindah ke top-level "serverExternalPackages"
  // di Next.js 15+. Tapi untuk @supabase/supabase-js tidak diperlukan karena
  // sudah isomorphic (bekerja di edge & node).
};

export default nextConfig;
