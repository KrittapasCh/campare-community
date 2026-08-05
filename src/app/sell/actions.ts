"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ItemCondition } from "@/lib/types";

export type FormState = { error?: string; message?: string };

const CONDITIONS: ItemCondition[] = [
  "new",
  "like_new",
  "good",
  "fair",
  "for_parts",
];

export async function createListing(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  if (!isSupabaseConfigured)
    return { error: "ยังไม่ได้ตั้งค่า Supabase — ตรวจไฟล์ .env.local" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อนลงประกาศ" };

  const productId = String(formData.get("product_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const price = Number(formData.get("price"));
  const quantity = Number(formData.get("quantity") ?? 1);
  const condition = String(formData.get("condition") ?? "good") as ItemCondition;
  const warranty = String(formData.get("warranty_expire_date") ?? "").trim();
  const shutterRaw = String(formData.get("shutter_count") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const province = String(formData.get("province") ?? "").trim();

  if (!productId) return { error: "เลือกรุ่นสินค้าก่อน" };
  if (!title) return { error: "ใส่หัวข้อประกาศ" };
  if (!Number.isFinite(price) || price <= 0)
    return { error: "ราคาต้องเป็นตัวเลขมากกว่า 0" };
  if (price > 10_000_000) return { error: "ราคาสูงเกินไป ตรวจสอบอีกครั้ง" };
  if (!Number.isInteger(quantity) || quantity < 1)
    return { error: "จำนวนต้องเป็นจำนวนเต็มอย่างน้อย 1" };
  if (!CONDITIONS.includes(condition)) return { error: "สภาพสินค้าไม่ถูกต้อง" };

  const { error } = await supabase.from("listings").insert({
    product_id: productId,
    seller_id: user.id,
    title,
    price,
    quantity,
    condition,
    warranty_expire_date: warranty || null,
    shutter_count: shutterRaw ? Number(shutterRaw) : null,
    description: description || null,
    province: province || null,
    status: "active",
  });

  if (error) return { error: `ลงประกาศไม่สำเร็จ: ${error.message}` };

  // อัปเดตราคากลางของรุ่นนี้จากประกาศที่ยัง active
  await refreshMarketPrice(productId);

  revalidatePath("/profile");
  revalidatePath("/category");
  redirect("/profile?tab=selling");
}

export async function closeListing(formData: FormData) {
  if (!isSupabaseConfigured) return;

  const id = String(formData.get("listing_id") ?? "");
  const productId = String(formData.get("product_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("listings")
    .update({ status: "sold" })
    .eq("id", id)
    .eq("seller_id", user.id);

  if (productId) await refreshMarketPrice(productId);

  revalidatePath("/profile");
}

export async function reopenListing(formData: FormData) {
  if (!isSupabaseConfigured) return;

  const id = String(formData.get("listing_id") ?? "");
  const productId = String(formData.get("product_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("listings")
    .update({ status: "active" })
    .eq("id", id)
    .eq("seller_id", user.id);

  if (productId) await refreshMarketPrice(productId);

  revalidatePath("/profile");
}

/**
 * คำนวณราคากลางใหม่จากประกาศที่ยัง active แล้วเขียนกลับลง products.market_price
 * (view product_market_price ใช้ดูรายละเอียด ส่วนคอลัมน์นี้ใช้แสดง/เรียงเร็ว ๆ)
 */
async function refreshMarketPrice(productId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("listings")
    .select("price")
    .eq("product_id", productId)
    .eq("status", "active")
    .eq("is_deleted", false);

  if (!data?.length) return;

  const prices = data.map((r) => Number(r.price)).sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);
  const median =
    prices.length % 2 === 0 ? (prices[mid - 1] + prices[mid]) / 2 : prices[mid];

  await supabase
    .from("products")
    .update({ market_price: Math.round(median) })
    .eq("id", productId);
}
