import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/user";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ItemCondition } from "@/lib/types";

export type CartRow = {
  id: string;
  quantity: number;
  selected: boolean;
  listing: {
    id: string;
    product_id: string;
    title: string;
    price: number;
    quantity: number;
    condition: ItemCondition;
    province: string | null;
    status: string;
    seller_name: string;
    product_name: string;
    product_no: string;
    product_slug: string;
    thumbnail_url: string | null;
  } | null;
};

/** ดึงตะกร้าของผู้ใช้ปัจจุบัน — คืน [] ถ้ายังไม่ล็อกอินหรือยังไม่มีตะกร้า */
export const getCartItems = cache(async (): Promise<CartRow[]> => {
  if (!isSupabaseConfigured) return [];

  try {
    const user = await getAuthUser();
    if (!user) return [];

    const supabase = await createClient();
    const { data: cart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!cart) return [];

    const { data, error } = await supabase
      .from("cart_items")
      .select(
        `id, quantity, selected, added_at,
         listings (
           id, product_id, title, price, quantity, condition, province, status,
           profiles ( display_name ),
           products ( name, product_no, slug, thumbnail_url )
         )`
      )
      .eq("cart_id", cart.id)
      .order("added_at", { ascending: false });

    if (error) throw error;

    type Raw = {
      id: string;
      quantity: number;
      selected: boolean;
      listings: {
        id: string;
        product_id: string;
        title: string;
        price: number;
        quantity: number;
        condition: ItemCondition;
        province: string | null;
        status: string;
        profiles: { display_name: string } | null;
        products: {
          name: string;
          product_no: string;
          slug: string;
          thumbnail_url: string | null;
        } | null;
      } | null;
    };

    return ((data ?? []) as unknown as Raw[]).map((row) => ({
      id: row.id,
      quantity: row.quantity,
      selected: row.selected,
      listing: row.listings
        ? {
            id: row.listings.id,
            product_id: row.listings.product_id,
            title: row.listings.title,
            price: Number(row.listings.price),
            quantity: row.listings.quantity,
            condition: row.listings.condition,
            province: row.listings.province,
            status: row.listings.status,
            seller_name: row.listings.profiles?.display_name ?? "ผู้ขาย",
            product_name: row.listings.products?.name ?? "-",
            product_no: row.listings.products?.product_no ?? "-",
            product_slug: row.listings.products?.slug ?? "",
            thumbnail_url: row.listings.products?.thumbnail_url ?? null,
          }
        : null,
    }));
  } catch {
    return [];
  }
});

/**
 * จำนวนชิ้นในตะกร้า สำหรับ badge บน header
 *
 * ดึงแค่คอลัมน์ quantity ไม่ join อะไรเลย — badge ต้องการแค่ตัวเลข
 * (เดิมเรียก getCartItems() ซึ่ง join 3 ตารางทุกครั้งที่โหลดหน้า เปลืองมาก)
 */
export async function getCartCount(): Promise<number> {
  if (!isSupabaseConfigured) return 0;

  try {
    const user = await getAuthUser();
    if (!user) return 0;

    const supabase = await createClient();
    const { data } = await supabase
      .from("cart_items")
      .select("quantity, carts!inner ( user_id )")
      .eq("carts.user_id", user.id);

    return ((data ?? []) as { quantity: number }[]).reduce(
      (sum, i) => sum + i.quantity,
      0
    );
  } catch {
    return 0;
  }
}

export function cartTotals(items: CartRow[]) {
  const selected = items.filter((i) => i.selected && i.listing);
  const subtotal = selected.reduce(
    (sum, i) => sum + (i.listing?.price ?? 0) * i.quantity,
    0
  );
  return { selected, subtotal, count: selected.length };
}
