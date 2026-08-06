"use client";

import { useActionState } from "react";
import { createPost, type CommunityState } from "@/app/community/actions";
import SubmitButton from "@/components/auth/submit-button";
import { PRODUCT_TYPE_LABEL, type ProductOption } from "@/lib/types";

const initial: CommunityState = {};

const field =
  "mt-1 w-full rounded-lg border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400";

export default function PostForm({ products }: { products: ProductOption[] }) {
  const [state, formAction] = useActionState(createPost, initial);

  return (
    <form action={formAction} className="space-y-5">
      <label className="flex items-start gap-3 rounded-card border border-ink-200 p-4">
        <input
          type="checkbox"
          name="is_question"
          defaultChecked
          className="mt-1 accent-brand-400"
        />
        <span>
          <span className="block text-sm font-medium">นี่คือคำถาม</span>
          <span className="block text-xs text-ink-500">
            ติ๊กไว้ถ้าอยากได้คำตอบ — คุณจะเลือกคำตอบที่ถูกใจได้ทีหลัง
            เอาออกถ้าเป็นการแชร์ประสบการณ์เฉย ๆ
          </span>
        </span>
      </label>

      <div>
        <label htmlFor="title" className="text-sm font-medium">
          หัวข้อ <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          required
          minLength={5}
          maxLength={150}
          className={field}
          placeholder="เช่น งบ 50,000 ถ่ายพอร์ตเทรต ควรเลือกตัวไหนดี"
        />
      </div>

      <div>
        <label htmlFor="body" className="text-sm font-medium">
          เนื้อหา <span className="text-red-500">*</span>
        </label>
        <textarea
          id="body"
          name="body"
          rows={8}
          required
          minLength={20}
          className={field}
          placeholder="เล่าให้ละเอียดหน่อยว่าจะเอาไปใช้ทำอะไร เคยใช้อะไรมาก่อน ติดปัญหาตรงไหน คนตอบจะได้ช่วยได้ตรงจุด"
        />
      </div>

      <div>
        <label htmlFor="product_id" className="text-sm font-medium">
          เกี่ยวกับสินค้ารุ่นไหน
        </label>
        <select id="product_id" name="product_id" defaultValue="" className={field}>
          <option value="">— ไม่เจาะจงรุ่น —</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              [{PRODUCT_TYPE_LABEL[p.product_type]}] {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="tags" className="text-sm font-medium">
          แท็ก
        </label>
        <input
          id="tags"
          name="tags"
          className={field}
          placeholder="เช่น มือใหม่ พอร์ตเทรต งบห้าหมื่น (คั่นด้วยเว้นวรรคหรือคอมมา สูงสุด 5 แท็ก)"
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="rounded-lg bg-ink-50 px-4 py-3 text-xs text-ink-500">
        กระทู้จะขึ้นสถานะ <strong>รออนุมัติ</strong> จนกว่าผู้ดูแลจะตรวจสอบ
      </div>

      <SubmitButton pendingText="กำลังส่ง…">ตั้งกระทู้</SubmitButton>
    </form>
  );
}
