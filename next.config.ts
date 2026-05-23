import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // إعدادات الصور الخاصة بك لضمان عملها
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: "https", hostname: "i.imgur.com" }
    ],
  },

  // تمكين التحقق للكشف عن الأخطاء الحقيقية
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
