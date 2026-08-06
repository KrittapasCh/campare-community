"use client";

import Link from "next/link";
import { useActionState } from "react";
import { setTargetPrice, type WishlistState } from "@/app/wishlist/actions";
import { useFormStatus } from "react-dom";

const initial: WishlistState = {};

function Save() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-lg bg-brand-400 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
    >
      {pending ? "กำลังบันทึก…" : "ตั้งเตือน"}
    </button>
  );
}

export default function WishlistTarget({
  productId,
  slug,
  signedIn,
  currentTarget,
}: {
  productId: string;
  slug: string;
  signedIn: boolean;
  currentTarget: number | null;
}) {
  const [state, formAction] = useActionState(setTargetPrice, initial);

  if (!signedIn) {
    return (
      <div className="mt-4 rounded-card border border-ink-100 bg-ink-50 p-4 text-sm">
        <p className="font-medium">อยากรู้ตอนมีของเข้า?</p>
        <p className="mt-1 text-ink-500">
          <Link
            href={`/login?next=/product/${slug}`}
            className="font-medium text-brand-600 hover:underline"
          >
            เข้าสู่ระบบ
          </Link>{" "}
          แล้วตั้งราคาเป้าหมายไว้ พอมีคนลงประกาศตรงเงื่อนไข ระบบจะเตือนให้
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-card border border-ink-100 bg-ink-50 p-4">
      <p className="text-sm font-medium">แจ้งเตือนเมื่อมีของเข้า</p>
      <p className="mt-0.5 text-xs text-ink-500">
        ใส่ราคาที่รับได้ ระบบจะเตือนเฉพาะประกาศที่ราคาไม่เกินนี้ —
        เว้นว่างไว้ถ้าอยากรู้ทุกประกาศ
      </p>

      <form action={formAction} className="mt-3 flex gap-2">
        <input type="hidden" name="product_id" value={productId} />
        <input type="hidden" name="slug" value={slug} />
        <input
          name="target_price"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          defaultValue={currentTarget ?? ""}
          placeholder="เช่น 60000"
          className="min-w-0 flex-1 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
        />
        <Save />
      </form>

      {state.error && (
        <p className="mt-2 text-xs text-red-600">{state.error}</p>
      )}
      {state.message && (
        <p className="mt-2 text-xs text-green-600">{state.message}</p>
      )}
    </div>
  );
}
