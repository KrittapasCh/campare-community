import Link from "next/link";
import ProductForm from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/admin";
import type { Company } from "@/lib/types";

export default async function NewProductPage() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("companies")
    .select("id, name, slug, country, logo_url")
    .order("name");

  return (
    <>
      <Link
        href="/admin/products"
        className="text-sm text-ink-500 hover:text-brand-600"
      >
        ← กลับไปรายการสินค้า
      </Link>
      <h1 className="mt-2 text-2xl font-bold">เพิ่มสินค้า</h1>
      <p className="mt-1 text-sm text-ink-500">
        ช่องสเปกจะเปลี่ยนตามประเภทที่เลือก — กล้องกับเลนส์มีตารางสเปกแยกของตัวเอง
      </p>

      <div className="mt-6">
        <ProductForm companies={(data ?? []) as Company[]} />
      </div>
    </>
  );
}
