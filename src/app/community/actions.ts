"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type CommunityState = { error?: string; message?: string };

const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s || null;
};

/** แท็ก: รับได้ทั้งเว้นวรรค คอมมา หรือขึ้นบรรทัดใหม่ ตัด # ออกให้ */
function parseTags(raw: string) {
  return Array.from(
    new Set(
      raw
        .split(/[\n,\s]+/)
        .map((s) => s.replace(/^#/, "").trim().toLowerCase())
        .filter(Boolean)
    )
  ).slice(0, 5);
}

export async function createPost(
  _prev: CommunityState,
  formData: FormData
): Promise<CommunityState> {
  if (!isSupabaseConfigured) return { error: "ยังไม่ได้ตั้งค่า Supabase" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อนตั้งกระทู้" };

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const isQuestion = formData.get("is_question") === "on";

  if (title.length < 5) return { error: "หัวข้อสั้นไป เขียนอย่างน้อย 5 ตัวอักษร" };
  if (body.length < 20)
    return { error: "เนื้อหาสั้นไป เขียนอย่างน้อย 20 ตัวอักษร" };

  const { error } = await supabase.from("community_posts").insert({
    author_id: user.id,
    product_id: str(formData.get("product_id")),
    title,
    body,
    tags,
    is_question: isQuestion,
    status: "pending", // รอผู้ดูแลอนุมัติก่อนขึ้นหน้าเว็บ
  });

  if (error) return { error: `ตั้งกระทู้ไม่สำเร็จ: ${error.message}` };

  revalidatePath("/community");
  revalidatePath("/admin/moderation");
  redirect("/community?submitted=1");
}

export async function addPostComment(
  _prev: CommunityState,
  formData: FormData
): Promise<CommunityState> {
  if (!isSupabaseConfigured) return { error: "ยังไม่ได้ตั้งค่า Supabase" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อนตอบกระทู้" };

  const postId = String(formData.get("post_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!postId) return { error: "ไม่พบกระทู้" };
  if (body.length < 2) return { error: "พิมพ์ข้อความก่อนส่ง" };

  const { error } = await supabase.from("comments").insert({
    author_id: user.id,
    target_type: "post",
    target_id: postId,
    body,
  });

  if (error) return { error: `ตอบกระทู้ไม่สำเร็จ: ${error.message}` };

  // แจ้งเตือนเจ้าของกระทู้ (ถ้าไม่ใช่ตัวเองตอบ)
  const { data: post } = await supabase
    .from("community_posts")
    .select("author_id, title")
    .eq("id", postId)
    .maybeSingle();

  if (post && post.author_id !== user.id) {
    await supabase.from("notifications").insert({
      user_id: post.author_id,
      type: "question_answered",
      title: "มีคนตอบกระทู้ของคุณ",
      body: post.title,
      link: `/community/${postId}`,
    });
  }

  revalidatePath(`/community/${postId}`);
  return { message: "ส่งคำตอบแล้ว" };
}

/** เจ้าของกระทู้เลือกคำตอบที่ใช่ — ทำได้เฉพาะกระทู้ที่เป็นคำถาม */
export async function markAsAnswer(formData: FormData) {
  if (!isSupabaseConfigured) return;

  const commentId = String(formData.get("comment_id") ?? "");
  const postId = String(formData.get("post_id") ?? "");
  const current = formData.get("is_answer") === "true";
  if (!commentId || !postId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: post } = await supabase
    .from("community_posts")
    .select("author_id")
    .eq("id", postId)
    .maybeSingle();

  if (!post || post.author_id !== user.id) return;

  // มีคำตอบที่ถูกเลือกได้ทีละอัน — เคลียร์ของเดิมก่อน
  if (!current) {
    await supabase
      .from("comments")
      .update({ is_answer: false })
      .eq("target_type", "post")
      .eq("target_id", postId);
  }

  await supabase
    .from("comments")
    .update({ is_answer: !current })
    .eq("id", commentId);

  revalidatePath(`/community/${postId}`);
}
