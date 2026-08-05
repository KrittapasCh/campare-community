import { redirect } from "next/navigation";
import type { Metadata } from "next";

import ListingForm from "@/components/listing/listing-form";
import { getCurrentUser, getProducts } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "ลงประกาศขาย" };

type SearchParams = Promise<{ product?: string }>;

export default async function SellPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">ลงประกาศขาย</h1>
        <p className="mt-3 text-ink-500">
          หน้านี้ต้องเชื่อม Supabase ก่อน — ตั้งค่า{" "}
          <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-sm">
            .env.local
          </code>
        </p>
      </div>
    );
  }

  const session = await getCurrentUser();
  if (!session) redirect("/login?next=/sell");

  const sp = await searchParams;
  const products = await getProducts();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">ลงประกาศขาย</h1>
      <p className="mt-1 text-sm text-ink-500">
        ประกาศจะไปแสดงในหน้ารายละเอียดของรุ่นที่เลือก
        และถูกนำไปคำนวณราคากลางมือสองด้วย
      </p>

      <div className="mt-6">
        <ListingForm products={products} defaultProductSlug={sp.product} />
      </div>
    </div>
  );
}
