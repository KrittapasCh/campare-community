"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type CartState = { error?: string; message?: string };

/** หา cart ของผู้ใช้ ถ้ายังไม่มีก็สร้าง (1 user = 1 cart) */
async function getOrCreateCart(userId: string) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return existing.id as string;

  const { data: created, error } = await supabase
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .single();

  if (error) throw error;
  return created.id as string;
}

export async function addToCart(
  _prev: CartState,
  formData: FormData
): Promise<CartState> {
  if (!isSupabaseConfigured)
    return { error: "ยังไม่ได้ตั้งค่า Supabase" };

  const listingId = String(formData.get("listing_id") ?? "");
  if (!listingId) return { error: "ไม่พบประกาศที่จะหยิบใส่ตะกร้า" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/cart")}`);

  // กันซื้อของตัวเอง
  const { data: listing } = await supabase
    .from("listings")
    .select("id, seller_id, status, quantity")
    .eq("id", listingId)
    .maybeSingle();

  if (!listing) return { error: "ประกาศนี้ถูกลบไปแล้ว" };
  if (listing.seller_id === user.id)
    return { error: "นี่เป็นประกาศของคุณเอง หยิบใส่ตะกร้าไม่ได้" };
  if (listing.status !== "active")
    return { error: "ประกาศนี้ปิดการขายไปแล้ว" };

  const cartId = await getOrCreateCart(user.id);

  // ถ้ามีในตะกร้าอยู่แล้วให้บวกจำนวนเพิ่ม
  const { data: existingItem } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (existingItem) {
    const next = Math.min(existingItem.quantity + 1, listing.quantity);
    await supabase
      .from("cart_items")
      .update({ quantity: next })
      .eq("id", existingItem.id);
  } else {
    const { error } = await supabase
      .from("cart_items")
      .insert({ cart_id: cartId, listing_id: listingId, quantity: 1 });
    if (error) return { error: `หยิบใส่ตะกร้าไม่สำเร็จ: ${error.message}` };
  }

  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { message: "หยิบใส่ตะกร้าแล้ว" };
}

export async function updateQuantity(formData: FormData) {
  if (!isSupabaseConfigured) return;

  const itemId = String(formData.get("item_id") ?? "");
  const delta = Number(formData.get("delta") ?? 0);
  if (!itemId || !delta) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: item } = await supabase
    .from("cart_items")
    .select("id, quantity, listings ( quantity )")
    .eq("id", itemId)
    .maybeSingle();

  if (!item) return;

  const stock =
    (item.listings as unknown as { quantity: number } | null)?.quantity ?? 1;
  const next = Math.min(Math.max(item.quantity + delta, 1), stock);

  await supabase.from("cart_items").update({ quantity: next }).eq("id", itemId);

  revalidatePath("/cart");
}

export async function removeItem(formData: FormData) {
  if (!isSupabaseConfigured) return;

  const itemId = String(formData.get("item_id") ?? "");
  if (!itemId) return;

  const supabase = await createClient();
  await supabase.from("cart_items").delete().eq("id", itemId);

  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

export async function toggleSelect(formData: FormData) {
  if (!isSupabaseConfigured) return;

  const itemId = String(formData.get("item_id") ?? "");
  const selected = formData.get("selected") === "true";
  if (!itemId) return;

  const supabase = await createClient();
  await supabase
    .from("cart_items")
    .update({ selected: !selected })
    .eq("id", itemId);

  revalidatePath("/cart");
}

export async function selectAll(formData: FormData) {
  if (!isSupabaseConfigured) return;

  const value = formData.get("value") === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!cart) return;

  await supabase
    .from("cart_items")
    .update({ selected: value })
    .eq("cart_id", cart.id);

  revalidatePath("/cart");
}
