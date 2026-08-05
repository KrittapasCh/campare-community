import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

const plex = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CamPare Community — เปรียบเทียบและซื้อขายกล้อง",
    template: "%s | CamPare Community",
  },
  description:
    "แพลตฟอร์มเปรียบเทียบสเปกกล้อง 2–4 รุ่นแบบ side-by-side พร้อมตลาดมือสอง รีวิว แกลเลอรีภาพตัวอย่าง และคอมมูนิตี้ถาม-ตอบ",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={plex.variable}>
      <body className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
