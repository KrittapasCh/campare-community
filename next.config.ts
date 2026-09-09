import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // รูปสินค้าที่อัปโหลดขึ้น Supabase Storage
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
        : []),
      // รูปกล้องจาก CameraDatabase (MIT) เสิร์ฟผ่าน jsDelivr ซึ่งเป็น CDN
      // สำหรับไฟล์ใน GitHub โดยเฉพาะ — ไม่ต้องอัป 3,858 ไฟล์ขึ้น Storage เอง
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
        pathname: "/gh/leavestylecode/CameraDatabase@**",
      },
      // รูปตัวอย่างตอน dev (placehold.co ถูกเอาออกแล้ว เพราะส่ง SVG มาซึ่ง next/image บล็อก
      // ตอนนี้ใช้ ProductThumb วาด placeholder เองแทน)
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
