"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

async function currentUser() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, user };
}

/** อ่านแล้วแล้วเด้งไปหน้าปลายทาง — ใช้ตอนกดที่ตัวแจ้งเตือน */
export async function openNotification(formData: FormData) {
  const ctx = await currentUser();
  const id = String(formData.get("id") ?? "");
  const link = String(formData.get("link") ?? "");

  if (ctx && id) {
    await ctx.supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", ctx.user.id);
  }

  revalidatePath("/", "layout");
  redirect(link || "/notifications");
}

export async function markAllRead() {
  const ctx = await currentUser();
  if (!ctx) return;

  await ctx.supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", ctx.user.id)
    .eq("is_read", false);

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}

export async function deleteNotification(formData: FormData) {
  const ctx = await currentUser();
  if (!ctx) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await ctx.supabase
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("user_id", ctx.user.id);

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}

export async function clearReadNotifications() {
  const ctx = await currentUser();
  if (!ctx) return;

  await ctx.supabase
    .from("notifications")
    .delete()
    .eq("user_id", ctx.user.id)
    .eq("is_read", true);

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}
