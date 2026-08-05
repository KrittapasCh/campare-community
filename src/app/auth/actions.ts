"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type AuthState = { error?: string; message?: string };

export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (!isSupabaseConfigured)
    return { error: "ยังไม่ได้ตั้งค่า Supabase — ตรวจไฟล์ .env.local" };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/profile");

  if (!email || !password) return { error: "กรอกอีเมลและรหัสผ่านให้ครบ" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      error:
        error.message === "Invalid login credentials"
          ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
          : error.message,
    };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function register(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (!isSupabaseConfigured)
    return { error: "ยังไม่ได้ตั้งค่า Supabase — ตรวจไฟล์ .env.local" };

  const displayName = String(formData.get("display_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const accept = formData.get("accept");

  if (!displayName || !email || !password)
    return { error: "กรอกชื่อ อีเมล และรหัสผ่านให้ครบ" };
  if (password.length < 8) return { error: "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร" };
  if (password !== confirm) return { error: "รหัสผ่านทั้งสองช่องไม่ตรงกัน" };
  if (!accept) return { error: "กรุณายอมรับข้อกำหนดและเงื่อนไข" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        phone,
        username: email.split("@")[0],
      },
    },
  });

  if (error) {
    return {
      error: error.message.includes("already registered")
        ? "อีเมลนี้ถูกใช้สมัครไปแล้ว"
        : error.message,
    };
  }

  return {
    message:
      "สมัครสมาชิกสำเร็จ — ถ้าเปิดการยืนยันอีเมลไว้ ให้ไปกดลิงก์ในอีเมลก่อนเข้าสู่ระบบ",
  };
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function updateProfile(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (!isSupabaseConfigured)
    return { error: "ยังไม่ได้ตั้งค่า Supabase — ตรวจไฟล์ .env.local" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อน" };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: String(formData.get("display_name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim() || null,
      bio: String(formData.get("bio") ?? "").trim() || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { message: "บันทึกข้อมูลเรียบร้อย" };
}
