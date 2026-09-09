import { Suspense } from "react";
import type { Metadata } from "next";
import CategoryFilters from "@/components/category-filters";
import ProductCard from "@/components/product-card";
import SortSelect from "@/components/sort-select";
import Pagination from "@/components/pagination";
import { getBrands, getProductsPage, type ProductFilters } from "@/lib/queries";
import { PRODUCT_TYPE_LABEL, type ProductType } from "@/lib/types";

export const metadata: Metadata = { title: "สินค้าทั้งหมด" };

type SearchParams = Promise<{
  q?: string;
  type?: string;
  brand?: string | string[];
  max?: string;
  rating?: string;
  sort?: string;
  page?: string;
}>;

export default async function CategoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const filters: ProductFilters = {
    q: sp.q,
    type: sp.type as ProductType | undefined,
    brands: sp.brand
      ? Array.isArray(sp.brand)
        ? sp.brand
        : [sp.brand]
      : undefined,
    maxPrice: sp.max ? Number(sp.max) : undefined,
    minRating: sp.rating ? Number(sp.rating) : undefined,
    sort: (sp.sort as ProductFilters["sort"]) ?? "popular",
  };

  const [page, brands] = await Promise.all([
    getProductsPage(filters, Number(sp.page) || 1),
    getBrands(),
  ]);
  const products = page.items;

  const heading = filters.q
    ? `ผลการค้นหา "${filters.q}"`
    : filters.type
      ? PRODUCT_TYPE_LABEL[filters.type]
      : "สินค้าทั้งหมด";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <Suspense fallback={<div className="h-96 rounded-card bg-ink-50" />}>
          <CategoryFilters brands={brands} />
        </Suspense>

        <div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{heading}</h1>
              <p className="mt-1 text-sm text-ink-500">
                พบ {page.total.toLocaleString("th-TH")} รายการ
                {page.totalPages > 1 &&
                  ` · หน้า ${page.page} จาก ${page.totalPages}`}
              </p>
            </div>
            <Suspense fallback={null}>
              <SortSelect />
            </Suspense>
          </div>

          {products.length === 0 ? (
            <div className="mt-10 rounded-card border border-dashed border-ink-200 py-16 text-center">
              <p className="font-medium">ไม่พบสินค้าที่ตรงกับเงื่อนไข</p>
              <p className="mt-1 text-sm text-ink-500">
                ลองลดตัวกรอง หรือเปลี่ยนคำค้นหาดู
              </p>
            </div>
          ) : (
            <>
              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              <Suspense fallback={null}>
                <Pagination page={page.page} totalPages={page.totalPages} />
              </Suspense>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
