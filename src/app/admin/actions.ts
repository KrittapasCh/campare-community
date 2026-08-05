"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** ตรวจว่าเป็น admin จริงก่อนทำงานทุกครั้ง (ห้ามเชื่อ UI อย่างเดียว) */
async function assertAdmin() {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") return null;
  return { supabase, user };
}

/* ---------- ตรวจสอบเนื้อหา ---------- */

export async function moderatePhoto(formData: FormData) {
  const ctx = await assertAdmin();
  if (!ctx) return;

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!id || !["approved", "rejected"].includes(decision)) return;

  await ctx.supabase
    .from("gallery_photos")
    .update({ status: decision })
    .eq("id", id);

  revalidatePath("/admin/moderation");
  revalidatePath("/admin");
}

export async function moderatePost(formData: FormData) {
  const ctx = await assertAdmin();
  if (!ctx) return;

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!id || !["approved", "rejected"].includes(decision)) return;

  await ctx.supabase
    .from("community_posts")
    .update({ status: decision })
    .eq("id", id);

  revalidatePath("/admin/moderation");
  revalidatePath("/admin");
}

export async function resolveReport(formData: FormData) {
  const ctx = await assertAdmin();
  if (!ctx) return;

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!id || !["approved", "rejected"].includes(decision)) return;

  await ctx.supabase
    .from("reports")
    .update({
      status: decision,
      handled_by: ctx.user.id,
      handled_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/admin/reports");
  revalidatePath("/admin");
}

/* ---------- จัดการสมาชิก ---------- */

export async function setUserRole(formData: FormData) {
  const ctx = await assertAdmin();
  if (!ctx) return;

  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!id || !["user", "admin"].includes(role)) return;

  // กันเผลอถอดสิทธิ์ตัวเองจนไม่มี admin เหลือ
  if (id === ctx.user.id && role === "user") return;

  await ctx.supabase.from("profiles").update({ role }).eq("id", id);

  revalidatePath("/admin/users");
}

export async function setUserActive(formData: FormData) {
  const ctx = await assertAdmin();
  if (!ctx) return;

  const id = String(formData.get("id") ?? "");
  const deleted = formData.get("deleted") === "true";
  if (!id || id === ctx.user.id) return;

  await ctx.supabase
    .from("profiles")
    .update({ is_deleted: deleted })
    .eq("id", id);

  revalidatePath("/admin/users");
  revalidatePath("/admin");
}
