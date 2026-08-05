import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import ProductThumb from "@/components/product-thumb";
import { removeItem, selectAll, toggleSelect, updateQuantity } from "@/app/cart/actions";
import { cartTotals, getCartItems } from "@/lib/cart";
import { getCurrentUser } from "@/lib/queries";
import { formatPrice } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { CONDITION_LABEL } from "@/lib/types";

export const metadata: Metadata = { title: "ตะกร้าสินค้า" };

export default async function CartPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">ตะกร้าสินค้า</h1>
        <p className="mt-3 text-ink-500">หน้านี้ต้องเชื่อม Supabase ก่อน</p>
      </div>
    );
  }

  const session = await getCurrentUser();
  if (!session) redirect("/login?next=/cart");

  const items = await getCartItems();
  const { subtotal, count } = cartTotals(items);
  const allSelected = items.length > 0 && items.every((i) => i.selected);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-5xl">🛒</p>
        <h1 className="mt-4 text-2xl font-bold">ตะกร้าว่างอยู่</h1>
        <p className="mt-2 text-sm text-ink-500">
          ไปหาของที่ถูกใจจากประกาศขายมือสองในระบบก่อน
        </p>
        <Link
          href="/category"
          className="mt-6 inline-block rounded-lg bg-brand-400 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-500"
        >
          เลือกสินค้า
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">ตะกร้าสินค้า</h1>
      <p className="mt-1 text-sm text-ink-500">
        เลือกรายการที่ต้องการสั่งซื้อ แล้วกดดำเนินการต่อ
      </p>

      {/* หัวตาราง (ซ่อนบนจอเล็ก) */}
      <div className="mt-6 hidden grid-cols-[auto_1fr_130px_130px_130px_80px] gap-4 border-b border-ink-100 px-4 pb-2 text-xs font-medium text-ink-500 md:grid">
        <span />
        <span>สินค้า</span>
        <span className="text-right">ราคาต่อชิ้น</span>
        <span className="text-center">จำนวน</span>
        <span className="text-right">ราคารวม</span>
        <span className="text-right">แอคชัน</span>
      </div>

      <ul className="divide-y divide-ink-100 border-b border-ink-100">
        {items.map((item) => {
          const l = item.listing;
          const unavailable = !l || l.status !== "active";
          const lineTotal = (l?.price ?? 0) * item.quantity;

          return (
            <li
              key={item.id}
              className="grid grid-cols-[auto_1fr] gap-4 px-4 py-4 md:grid-cols-[auto_1fr_130px_130px_130px_80px] md:items-center"
            >
              {/* checkbox */}
              <form action={toggleSelect} className="flex items-center">
                <input type="hidden" name="item_id" value={item.id} />
                <input
                  type="hidden"
                  name="selected"
                  value={String(item.selected)}
                />
                <button
                  type="submit"
                  aria-label={item.selected ? "ยกเลิกเลือก" : "เลือก"}
                  disabled={unavailable}
                  className={
                    "grid size-5 place-items-center rounded border transition disabled:opacity-40 " +
                    (item.selected
                      ? "border-brand-400 bg-brand-400 text-white"
                      : "border-ink-300 bg-white hover:border-brand-400")
                  }
                >
                  {item.selected && (
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </form>

              {/* สินค้า */}
              <div className="flex min-w-0 gap-3">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                  <ProductThumb
                    src={l?.thumbnail_url}
                    alt={l?.product_name ?? "สินค้า"}
                    sizes="64px"
                  />
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/product/${l?.product_slug}`}
                    className="line-clamp-1 text-sm font-medium hover:text-brand-600"
                  >
                    {l?.title ?? "ประกาศถูกลบแล้ว"}
                  </Link>
                  <p className="text-xs text-ink-500">
                    {l?.product_name} · #{l?.product_no}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    {l && CONDITION_LABEL[l.condition]}
                    {l?.province && ` · ${l.province}`} · ผู้ขาย {l?.seller_name}
                  </p>
                  {unavailable && (
                    <p className="mt-1 text-xs font-medium text-red-600">
                      ประกาศนี้ปิดการขายแล้ว
                    </p>
                  )}
                </div>
              </div>

              {/* ราคาต่อชิ้น */}
              <p className="text-sm md:text-right">
                <span className="text-ink-500 md:hidden">ราคาต่อชิ้น </span>
                {formatPrice(l?.price)}
              </p>

              {/* จำนวน */}
              <div className="flex items-center gap-2 md:justify-center">
                <form action={updateQuantity}>
                  <input type="hidden" name="item_id" value={item.id} />
                  <input type="hidden" name="delta" value="-1" />
                  <button
                    type="submit"
                    disabled={item.quantity <= 1}
                    className="grid size-7 place-items-center rounded border border-ink-200 text-sm hover:border-brand-400 disabled:opacity-40"
                  >
                    −
                  </button>
                </form>
                <span className="w-8 text-center text-sm font-medium">
                  {item.quantity}
                </span>
                <form action={updateQuantity}>
                  <input type="hidden" name="item_id" value={item.id} />
                  <input type="hidden" name="delta" value="1" />
                  <button
                    type="submit"
                    disabled={!l || item.quantity >= l.quantity}
                    className="grid size-7 place-items-center rounded border border-ink-200 text-sm hover:border-brand-400 disabled:opacity-40"
                  >
                    +
                  </button>
                </form>
              </div>

              {/* ราคารวม */}
              <p className="text-sm font-bold text-brand-600 md:text-right">
                <span className="font-normal text-ink-500 md:hidden">รวม </span>
                {formatPrice(lineTotal)}
              </p>

              {/* ลบ */}
              <form action={removeItem} className="md:text-right">
                <input type="hidden" name="item_id" value={item.id} />
                <button
                  type="submit"
                  className="text-xs text-ink-400 underline-offset-2 hover:text-red-600 hover:underline"
                >
                  ลบ
                </button>
              </form>
            </li>
          );
        })}
      </ul>

      {/* สรุปยอด */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-card border border-ink-100 bg-ink-50 p-4">
        <form action={selectAll}>
          <input type="hidden" name="value" value={String(!allSelected)} />
          <button
            type="submit"
            className="text-sm font-medium text-ink-600 hover:text-brand-600"
          >
            {allSelected ? "ยกเลิกเลือกทั้งหมด" : `เลือกทั้งหมด (${items.length})`}
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-ink-500">
              รวม {count} รายการที่เลือก
            </p>
            <p className="text-2xl font-bold text-brand-600">
              {formatPrice(subtotal)}
            </p>
          </div>

          {count > 0 ? (
            <Link
              href="/checkout"
              className="rounded-lg bg-brand-400 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-500"
            >
              ดำเนินการต่อ
            </Link>
          ) : (
            <span className="cursor-not-allowed rounded-lg bg-ink-200 px-8 py-3 text-sm font-semibold text-white">
              ดำเนินการต่อ
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
