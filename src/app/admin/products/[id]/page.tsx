import Link from "next/link";
import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/admin";
import type { CameraSpecs, Company, LensSpecs, Product } from "@/lib/types";

type Params = Promise<{ id: string }>;

export default async function EditProductPage({ params }: { params: Params }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const [productRes, companiesRes] = await Promise.all([
    supabase
      .from("products")
      .select("*, camera_specs ( * ), lens_specs ( * )")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("companies")
      .select("id, name, slug, country, logo_url")
      .order("name"),
  ]);

  if (!productRes.data) notFound();

  const product = productRes.data as unknown as Product & {
    camera_specs?: CameraSpecs | null;
    lens_specs?: LensSpecs | null;
  };

  return (
    <>
      <Link
        href="/admin/products"
        className="text-sm text-ink-500 hover:text-brand-600"
      >
        ← กลับไปรายการสินค้า
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">แก้ไข {product.name}</h1>
        <Link
          href={`/product/${product.slug}`}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          ดูหน้าจริง →
        </Link>
      </div>

      <div className="mt-6">
        <ProductForm
          companies={(companiesRes.data ?? []) as Company[]}
          product={product}
        />
      </div>
    </>
  );
}
