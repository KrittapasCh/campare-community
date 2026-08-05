import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import PostForm from "@/components/community/post-form";
import { getCurrentUser, getProducts } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "ตั้งกระทู้" };

export default async function NewPostPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">ตั้งกระทู้</h1>
        <p className="mt-3 text-ink-500">หน้านี้ต้องเชื่อม Supabase ก่อน</p>
      </div>
    );
  }

  const session = await getCurrentUser();
  if (!session) redirect("/login?next=/community/new");

  const products = await getProducts();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/community" className="text-sm text-ink-500 hover:text-brand-600">
        ← กลับไปคอมมูนิตี้
      </Link>
      <h1 className="mt-2 text-2xl font-bold">ตั้งกระทู้</h1>
      <p className="mt-1 text-sm text-ink-500">
        ถามได้ทุกเรื่องเกี่ยวกับกล้อง หรือแชร์ประสบการณ์ใช้งานจริงให้คนอื่นอ่าน
      </p>

      <div className="mt-6">
        <PostForm products={products} />
      </div>
    </div>
  );
}
