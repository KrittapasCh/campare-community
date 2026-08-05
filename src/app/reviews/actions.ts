"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type FormState = { error?: string; message?: string };

/** แปลง textarea หลายบรรทัด -> array (ตัดบรรทัดว่าง, สูงสุด 8 ข้อ) */
function toList(raw: string) {
  return raw
    .split("\n")
    .map((s) => s.replace(/^[-+*•]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 8);
}

export async function submitReview(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  if (!isSupabaseConfigured)
    return { error: "ยังไม่ได้ตั้งค่า Supabase — ตรวจไฟล์ .env.local" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อนเขียนรีวิว" };

  const productId = String(formData.get("product_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const rating = Number(formData.get("rating"));
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const pros = toList(String(formData.get("pros") ?? ""));
  const cons = toList(String(formData.get("cons") ?? ""));

  if (!productId) return { error: "ไม่พบสินค้าที่จะรีวิว" };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return { error: "ให้คะแนน 1–5 ดาว" };
  if (body.length < 10)
    return { error: "เขียนรายละเอียดอย่างน้อย 10 ตัวอักษร" };

  // upsert เพราะ 1 คนรีวิว 1 รุ่นได้ครั้งเดียว (unique product_id + author_id)
  const { error } = await supabase.from("reviews").upsert(
    {
      product_id: productId,
      author_id: user.id,
      rating,
      title: title || null,
      body,
      pros,
      cons,
      status: "approved",
      is_deleted: false,
    },
    { onConflict: "product_id,author_id" }
  );

  if (error) return { error: `บันทึกรีวิวไม่สำเร็จ: ${error.message}` };

  if (slug) revalidatePath(`/product/${slug}`);
  revalidatePath("/profile");

  return { message: "บันทึกรีวิวเรียบร้อย ขอบคุณที่แบ่งปัน" };
}

export async function deleteReview(formData: FormData) {
  if (!isSupabaseConfigured) return;

  const id = String(formData.get("review_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // soft delete ตามหลักที่ใช้ทั้งระบบ
  await supabase
    .from("reviews")
    .update({ is_deleted: true })
    .eq("id", id)
    .eq("author_id", user.id);

  if (slug) revalidatePath(`/product/${slug}`);
  revalidatePath("/profile");
}
