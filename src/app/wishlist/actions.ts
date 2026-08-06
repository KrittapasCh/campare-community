"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type WishlistState = { error?: string; message?: string };

/**
 * ตั้งราคาเป้าหมายของรุ่นที่กดใจไว้
 * trigger listings_notify_wishlist จะเตือนเฉพาะตอนมีประกาศราคา <= ค่านี้
 */
export async function setTargetPrice(
  _prev: WishlistState,
  formData: FormData
): Promise<WishlistState> {
  if (!isSupabaseConfigured) return { error: "ยังไม่ได้ตั้งค่า Supabase" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อน" };

  const productId = String(formData.get("product_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const raw = String(formData.get("target_price") ?? "").trim();

  if (!productId) return { error: "ไม่พบสินค้า" };

  let target: number | null = null;
  if (raw) {
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0)
      return { error: "ราคาเป้าหมายต้องเป็นตัวเลขมากกว่า 0" };
    target = Math.round(n);
  }

  // หา wishlist หลัก ถ้ายังไม่มีก็สร้าง
  let { data: wl } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_default", true)
    .maybeSingle();

  if (!wl) {
    const { data: created, error } = await supabase
      .from("wishlists")
      .insert({ user_id: user.id })
      .select("id")
      .single();
    if (error) return { error: `สร้างรายการโปรดไม่สำเร็จ: ${error.message}` };
    wl = created;
  }

  const { error } = await supabase.from("wishlist_items").upsert(
    {
      wishlist_id: wl.id,
      product_id: productId,
      target_price: target,
      notify: true,
    },
    { onConflict: "wishlist_id,product_id" }
  );

  if (error) return { error: `บันทึกไม่สำเร็จ: ${error.message}` };

  if (slug) revalidatePath(`/product/${slug}`);
  revalidatePath("/profile");

  return {
    message: target
      ? `จะแจ้งเตือนเมื่อมีประกาศราคาไม่เกิน ${target.toLocaleString("th-TH")} บาท`
      : "จะแจ้งเตือนทุกครั้งที่มีประกาศใหม่ของรุ่นนี้",
  };
}
