import Link from "next/link";
import { toggleProductDeleted } from "@/app/admin/products/actions";
import { requireAdmin } from "@/lib/admin";
import { formatPrice } from "@/lib/format";
import { PRODUCT_TYPE_LABEL, STATUS_LABEL, type ProductType, type ProductionStatus } from "@/lib/types";

type SearchParams = Promise<{ saved?: string }>;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;

  const { data } = await supabase
    .from("products")
    .select(
      "id, slug, name, product_no, product_type, status, msrp, market_price, review_count, is_deleted, companies ( name )"
    )
    .order("name")
    .limit(200);

  const products = (data ?? []) as unknown as {
    id: string;
    slug: string;
    name: string;
    product_no: string;
    product_type: ProductType;
    status: ProductionStatus;
    msrp: number | null;
    market_price: number | null;
    review_count: number;
    is_deleted: boolean;
    companies: { name: string } | null;
  }[];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">จัดการสินค้า</h1>
          <p className="mt-1 text-sm text-ink-500">
            {products.length} รายการในระบบ
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-brand-400 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500"
        >
          + เพิ่มสินค้า
        </Link>
      </div>

      {sp.saved && (
        <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          บันทึกข้อมูลสินค้าเรียบร้อย
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-card border border-ink-100">
        <table className="w-full min-w-3xl text-sm">
          <thead className="bg-ink-50 text-left text-xs text-ink-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">สินค้า</th>
              <th className="px-4 py-2.5 font-medium">ประเภท</th>
              <th className="px-4 py-2.5 font-medium">สถานะ</th>
              <th className="px-4 py-2.5 text-right font-medium">ราคาป้าย</th>
              <th className="px-4 py-2.5 text-right font-medium">ราคากลาง</th>
              <th className="px-4 py-2.5 text-right font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {products.map((p) => (
              <tr key={p.id} className={p.is_deleted ? "opacity-45" : ""}>
                <td className="px-4 py-3">
                  <Link
                    href={`/product/${p.slug}`}
                    className="font-medium hover:text-brand-600"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs text-ink-400">
                    {p.companies?.name} · #{p.product_no}
                    {p.review_count > 0 && ` · ${p.review_count} รีวิว`}
                  </p>
                </td>
                <td className="px-4 py-3 text-xs">
                  {PRODUCT_TYPE_LABEL[p.product_type]}
                </td>
                <td className="px-4 py-3 text-xs">
                  {STATUS_LABEL[p.status]}
                  {p.is_deleted && (
                    <span className="ml-1.5 rounded-full bg-red-100 px-2 py-0.5 text-[11px] text-red-700">
                      ซ่อนอยู่
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-xs">
                  {formatPrice(p.msrp)}
                </td>
                <td className="px-4 py-3 text-right text-xs font-medium text-brand-600">
                  {formatPrice(p.market_price)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium hover:border-brand-300 hover:text-brand-600"
                    >
                      แก้ไข
                    </Link>
                    <form action={toggleProductDeleted}>
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        type="hidden"
                        name="deleted"
                        value={String(!p.is_deleted)}
                      />
                      <button
                        type="submit"
                        className={
                          "rounded-lg border px-3 py-1.5 text-xs font-medium " +
                          (p.is_deleted
                            ? "border-green-300 text-green-700 hover:bg-green-50"
                            : "border-ink-200 text-ink-600 hover:border-red-300 hover:text-red-600")
                        }
                      >
                        {p.is_deleted ? "เอากลับมาแสดง" : "ซ่อน"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-ink-400">
        ปุ่ม &quot;ซ่อน&quot; ใช้ soft delete (
        <code className="rounded bg-ink-100 px-1 font-mono">is_deleted</code>)
        สินค้าจะหายจากหน้าเว็บแต่ประวัติการซื้อและรีวิวเดิมยังอ้างอิงได้
      </p>
    </>
  );
}
