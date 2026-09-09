import type { Metadata } from "next";

export const metadata: Metadata = { title: "เกี่ยวกับเรา" };

const FEATURES = [
  ["User Management", "สมัครสมาชิก เข้าสู่ระบบ แก้ไขโปรไฟล์ และแยกสิทธิ์ User/Admin"],
  ["Product Database", "ค้นหารุ่นสินค้า ดูสเปกละเอียด ประวัติการผลิต และสถานะว่ายังผลิตอยู่หรือเลิกผลิตแล้ว"],
  ["Compare System", "เปรียบเทียบ 2–4 รุ่นแบบ side-by-side พร้อมไฮไลต์ช่องที่ต่างกันอัตโนมัติ"],
  ["Sample Gallery", "อัปโหลดภาพตัวอย่างพร้อมค่าที่ใช้ถ่าย และคอมเมนต์ใต้ภาพ"],
  ["Review System", "ให้คะแนน เขียนข้อดี-ข้อเสีย ระบบคำนวณคะแนนเฉลี่ยให้"],
  ["Marketplace", "บันทึกราคามือสอง แสดงราคากลาง และดูแนวโน้มราคา"],
  ["Wishlist", "บันทึกรุ่นที่สนใจ ตั้งราคาเป้าหมาย และรับแจ้งเตือนเมื่อมีของ"],
  ["Community", "ถาม-ตอบ แชร์ประสบการณ์ และแสดงความคิดเห็น"],
  ["Notification", "แจ้งเตือนเมื่อมีข้อมูลใหม่ รีวิวใหม่ หรือมีคนตอบคำถาม"],
  ["Admin", "เพิ่ม/แก้ไขข้อมูลสินค้า ตรวจสอบโพสต์ อนุมัติรูปภาพ และจัดการสมาชิก"],
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold">เกี่ยวกับ Shopcam</h1>
      <p className="mt-4 leading-relaxed text-ink-600">
        Shopcam เป็นแพลตฟอร์มสำหรับคนที่กำลังเลือกซื้อกล้อง
        โจทย์หลักคือทำให้การเทียบสเปกระหว่างรุ่นเข้าใจง่ายขึ้น
        โดยไม่ต้องเปิดหลายแท็บแล้วไล่อ่านเอง
        และเชื่อมข้อมูลสเปกเข้ากับราคามือสองจริงในตลาด
        เพื่อให้ตัดสินใจได้ว่ารุ่นไหน &quot;คุ้ม&quot; สำหรับงานที่จะเอาไปใช้
      </p>

      <h2 className="mt-10 text-xl font-bold">ฟังก์ชันหลัก</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        {FEATURES.map(([title, desc]) => (
          <div key={title} className="rounded-card border border-ink-100 p-4">
            <dt className="font-semibold text-brand-700">{title}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-ink-600">{desc}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-10 text-xl font-bold">เทคโนโลยีที่ใช้</h2>
      <ul className="mt-3 space-y-2 text-sm text-ink-600">
        <li>• Next.js 15 (App Router) + React 19 + TypeScript</li>
        <li>• Tailwind CSS v4</li>
        <li>• Supabase (PostgreSQL, Auth, Storage, Row Level Security)</li>
        <li>• Deploy บน Vercel</li>
      </ul>

      <p className="mt-10 rounded-card bg-ink-50 p-4 text-sm text-ink-500">
        โปรเจกต์นี้จัดทำเพื่อการศึกษาในรายวิชา System Analysis and Design
        ข้อมูลสเปกและราคาที่แสดงเป็นข้อมูลตัวอย่าง
      </p>
    </div>
  );
}
