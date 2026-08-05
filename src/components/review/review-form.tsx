"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { submitReview, type FormState } from "@/app/reviews/actions";
import SubmitButton from "@/components/auth/submit-button";
import type { Review } from "@/lib/types";

const initial: FormState = {};

const field =
  "mt-1 w-full rounded-lg border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400";

export default function ReviewForm({
  productId,
  slug,
  signedIn,
  existing,
}: {
  productId: string;
  slug: string;
  signedIn: boolean;
  existing?: Review | null;
}) {
  const [state, formAction] = useActionState(submitReview, initial);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [open, setOpen] = useState(false);

  if (!signedIn) {
    return (
      <div className="rounded-card border border-dashed border-ink-200 px-4 py-8 text-center">
        <p className="text-sm text-ink-500">
          อยากรีวิวรุ่นนี้? เข้าสู่ระบบก่อนนะ
        </p>
        <Link
          href={`/login?next=/product/${slug}`}
          className="mt-3 inline-block rounded-lg bg-brand-400 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-500"
        >
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-card border border-dashed border-ink-200 px-4 py-6 text-sm font-medium text-ink-600 hover:border-brand-300 hover:text-brand-600"
      >
        {existing ? "แก้ไขรีวิวของฉัน" : "+ เขียนรีวิวรุ่นนี้"}
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-card border border-ink-100 p-5"
    >
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="rating" value={rating} />

      <div>
        <p className="text-sm font-medium">ให้คะแนน</p>
        <div className="mt-1 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} ดาว`}
              className={
                "text-2xl leading-none transition " +
                ((hover || rating) >= n ? "text-brand-400" : "text-ink-200")
              }
            >
              ★
            </button>
          ))}
          <span className="ml-2 text-sm text-ink-500">
            {rating ? `${rating}/5` : "ยังไม่ได้เลือก"}
          </span>
        </div>
      </div>

      <div>
        <label htmlFor="title" className="text-sm font-medium">
          หัวข้อ
        </label>
        <input
          id="title"
          name="title"
          maxLength={120}
          defaultValue={existing?.title ?? ""}
          className={field}
          placeholder="เช่น ใช้มา 6 เดือน คุ้มเกินราคา"
        />
      </div>

      <div>
        <label htmlFor="body" className="text-sm font-medium">
          รายละเอียด <span className="text-red-500">*</span>
        </label>
        <textarea
          id="body"
          name="body"
          rows={5}
          required
          minLength={10}
          defaultValue={existing?.body ?? ""}
          className={field}
          placeholder="ใช้ถ่ายอะไร ชอบตรงไหน ไม่ชอบตรงไหน เทียบกับตัวที่เคยใช้เป็นยังไง"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pros" className="text-sm font-medium text-green-700">
            ข้อดี
          </label>
          <textarea
            id="pros"
            name="pros"
            rows={4}
            defaultValue={existing?.pros?.join("\n") ?? ""}
            className={field}
            placeholder={"บรรทัดละข้อ\nโฟกัสไว\nแบตอึด"}
          />
        </div>
        <div>
          <label htmlFor="cons" className="text-sm font-medium text-red-700">
            ข้อเสีย
          </label>
          <textarea
            id="cons"
            name="cons"
            rows={4}
            defaultValue={existing?.cons?.join("\n") ?? ""}
            className={field}
            placeholder={"บรรทัดละข้อ\nเมนูงง\nร้อนเวลาอัดวิดีโอนาน"}
          />
        </div>
      </div>

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

      <div className="flex gap-3">
        <SubmitButton pendingText="กำลังบันทึก…">
          {existing ? "อัปเดตรีวิว" : "ส่งรีวิว"}
        </SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-ink-200 px-5 py-2.5 text-sm font-medium text-ink-600 hover:border-ink-300"
        >
          ยกเลิก
        </button>
      </div>
    </form>
  );
}
