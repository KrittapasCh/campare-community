"use client";

import Link from "next/link";
import { useActionState } from "react";
import { addPostComment, type CommunityState } from "@/app/community/actions";
import SubmitButton from "@/components/auth/submit-button";

const initial: CommunityState = {};

export default function PostCommentForm({
  postId,
  signedIn,
  isQuestion,
}: {
  postId: string;
  signedIn: boolean;
  isQuestion: boolean;
}) {
  const [state, formAction] = useActionState(addPostComment, initial);
  const noun = isQuestion ? "คำตอบ" : "ความคิดเห็น";

  if (!signedIn) {
    return (
      <div className="rounded-card border border-dashed border-ink-200 px-4 py-6 text-center">
        <p className="text-sm text-ink-500">เข้าสู่ระบบเพื่อร่วมพูดคุย</p>
        <Link
          href={`/login?next=/community/${postId}`}
          className="mt-3 inline-block rounded-lg bg-brand-400 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-500"
        >
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="post_id" value={postId} />
      <textarea
        name="body"
        rows={4}
        required
        minLength={2}
        className="w-full rounded-lg border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
        placeholder={
          isQuestion
            ? "ตอบจากประสบการณ์จริงจะช่วยได้มาก บอกด้วยว่าเคยใช้รุ่นไหนมา"
            : "แสดงความคิดเห็น"
        }
      />

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {state.message}
        </p>
      )}

      <div className="flex justify-end">
        <div className="w-40">
          <SubmitButton pendingText="กำลังส่ง…">ส่ง{noun}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
