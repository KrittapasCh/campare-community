"use client";

import Link from "next/link";
import { useActionState } from "react";
import { addPhotoComment, type GalleryState } from "@/app/gallery/actions";
import SubmitButton from "@/components/auth/submit-button";

const initial: GalleryState = {};

export default function CommentForm({
  photoId,
  signedIn,
}: {
  photoId: string;
  signedIn: boolean;
}) {
  const [state, formAction] = useActionState(addPhotoComment, initial);

  if (!signedIn) {
    return (
      <div className="rounded-card border border-dashed border-ink-200 px-4 py-6 text-center">
        <p className="text-sm text-ink-500">
          เข้าสู่ระบบเพื่อแสดงความคิดเห็น
        </p>
        <Link
          href={`/login?next=/gallery/${photoId}`}
          className="mt-3 inline-block rounded-lg bg-brand-400 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-500"
        >
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="photo_id" value={photoId} />
      <textarea
        name="body"
        rows={3}
        required
        minLength={2}
        className="w-full rounded-lg border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
        placeholder="ถามค่าที่ใช้ถ่าย ชมภาพ หรือแชร์ประสบการณ์กับกล้องรุ่นนี้"
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
          <SubmitButton pendingText="กำลังส่ง…">ส่งความคิดเห็น</SubmitButton>
        </div>
      </div>
    </form>
  );
}
