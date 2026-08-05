import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import UploadForm from "@/components/gallery/upload-form";
import { getCurrentUser, getProducts } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "อัปโหลดภาพตัวอย่าง" };

export default async function UploadPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">อัปโหลดภาพตัวอย่าง</h1>
        <p className="mt-3 text-ink-500">หน้านี้ต้องเชื่อม Supabase ก่อน</p>
      </div>
    );
  }

  const session = await getCurrentUser();
  if (!session) redirect("/login?next=/gallery/upload");

  const products = await getProducts();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/gallery" className="text-sm text-ink-500 hover:text-brand-600">
        ← กลับไปแกลเลอรี
      </Link>
      <h1 className="mt-2 text-2xl font-bold">อัปโหลดภาพตัวอย่าง</h1>
      <p className="mt-1 text-sm text-ink-500">
        แชร์ภาพที่ถ่ายจากกล้องรุ่นไหน ใส่ค่าที่ใช้ถ่ายไว้ด้วย
        คนที่กำลังเลือกซื้อจะได้เห็นว่ากล้องรุ่นนั้นให้ภาพแบบไหนจริง ๆ
      </p>

      <div className="mt-6">
        <UploadForm products={products} />
      </div>
    </div>
  );
}
