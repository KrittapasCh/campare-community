import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import CheckoutForm from "@/components/checkout/checkout-form";
import { cartTotals, getCartItems } from "@/lib/cart";
import { getCurrentUser } from "@/lib/queries";
import { formatPrice } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "ชำระเงิน" };

export default async function CheckoutPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">ชำระเงิน</h1>
        <p className="mt-3 text-ink-500">หน้านี้ต้องเชื่อม Supabase ก่อน</p>
      </div>
    );
  }

  const session = await getCurrentUser();
  if (!session) redirect("/login?next=/checkout");

  const items = await getCartItems();
  const { selected, subtotal, count } = cartTotals(items);

  if (count === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">ยังไม่ได้เลือกสินค้า</h1>
        <p className="mt-2 text-sm text-ink-500">
          กลับไปที่ตะกร้าแล้วติ๊กเลือกรายการที่ต้องการซื้อก่อน
        </p>
        <Link
          href="/cart"
          className="mt-6 inline-block rounded-lg bg-brand-400 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-500"
        >
          ไปที่ตะกร้า
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">ชำระเงิน</h1>
      <p className="mt-1 text-sm text-ink-500">
        ระบบนี้เป็นการจำลองเพื่อการศึกษา ไม่มีการตัดเงินจริง
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <CheckoutForm />

        {/* สรุปคำสั่งซื้อ */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-card border border-ink-100 p-5">
            <h2 className="font-bold">สรุปคำสั่งซื้อ</h2>

            <ul className="mt-4 divide-y divide-ink-100">
              {selected.map((i) => (
                <li key={i.id} className="flex gap-3 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 font-medium">
                      {i.listing?.title}
                    </p>
                    <p className="text-xs text-ink-500">
                      {i.listing?.product_name} × {i.quantity}
                    </p>
                  </div>
                  <span className="shrink-0 font-medium">
                    {formatPrice((i.listing?.price ?? 0) * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-500">ราคาสินค้า</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">ค่าจัดส่ง</dt>
                <dd className="text-green-600">ส่งฟรี</dd>
              </div>
              <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-bold">
                <dt>รวมทั้งสิ้น</dt>
                <dd className="text-brand-600">{formatPrice(subtotal)}</dd>
              </div>
            </dl>

            <Link
              href="/cart"
              className="mt-4 block text-center text-xs text-ink-500 hover:text-brand-600"
            >
              ← กลับไปแก้ไขตะกร้า
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
