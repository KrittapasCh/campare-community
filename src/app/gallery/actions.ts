"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type GalleryState = { error?: string; message?: string };

const num = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s || null;
};

/**
 * บันทึกข้อมูลรูปหลังจากไฟล์ถูกอัปขึ้น Storage แล้ว
 * (ตัวไฟล์อัปจากฝั่ง browser โดยตรง ไม่ผ่าน server เพื่อไม่ให้ไฟล์ใหญ่วิ่งผ่าน serverless)
 */
export async function createPhoto(
  _prev: GalleryState,
  formData: FormData
): Promise<GalleryState> {
  if (!isSupabaseConfigured) return { error: "ยังไม่ได้ตั้งค่า Supabase" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อน" };

  const imageUrl = str(formData.get("image_url"));
  if (!imageUrl) return { error: "ยังไม่ได้อัปโหลดรูป" };

  const { error } = await supabase.from("gallery_photos").insert({
    author_id: user.id,
    product_id: str(formData.get("product_id")),
    lens_id: str(formData.get("lens_id")),
    title: str(formData.get("title")),
    image_url: imageUrl,
    original_url: str(formData.get("original_url")),
    shot_iso: num(formData.get("shot_iso")),
    shot_aperture: num(formData.get("shot_aperture")),
    shot_shutter: str(formData.get("shot_shutter")),
    shot_focal_mm: num(formData.get("shot_focal_mm")),
    taken_at: str(formData.get("taken_at")),
    status: "pending", // รอผู้ดูแลอนุมัติก่อนถึงจะขึ้นหน้าเว็บ
  });

  if (error) return { error: `บันทึกไม่สำเร็จ: ${error.message}` };

  revalidatePath("/gallery");
  revalidatePath("/admin/moderation");
  redirect("/gallery?submitted=1");
}

/** คอมเมนต์ใต้ภาพ — ใช้ตาราง comments แบบ polymorphic (target_type = 'photo') */
export async function addPhotoComment(
  _prev: GalleryState,
  formData: FormData
): Promise<GalleryState> {
  if (!isSupabaseConfigured) return { error: "ยังไม่ได้ตั้งค่า Supabase" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น" };

  const photoId = String(formData.get("photo_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!photoId) return { error: "ไม่พบภาพที่จะคอมเมนต์" };
  if (body.length < 2) return { error: "พิมพ์ข้อความก่อนส่ง" };

  const { error } = await supabase.from("comments").insert({
    author_id: user.id,
    target_type: "photo",
    target_id: photoId,
    body,
  });

  if (error) return { error: `ส่งความคิดเห็นไม่สำเร็จ: ${error.message}` };

  revalidatePath(`/gallery/${photoId}`);
  return { message: "ส่งความคิดเห็นแล้ว" };
}

export async function deletePhoto(formData: FormData) {
  if (!isSupabaseConfigured) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("gallery_photos")
    .update({ is_deleted: true })
    .eq("id", id)
    .eq("author_id", user.id);

  revalidatePath("/gallery");
}
