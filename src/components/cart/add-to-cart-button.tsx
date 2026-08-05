"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addToCart, type CartState } from "@/app/cart/actions";

const initial: CartState = {};

function Button({ disabled, label }: { disabled: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="shrink-0 rounded-lg bg-brand-400 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-ink-200"
    >
      {pending ? "กำลังหยิบ…" : label}
    </button>
  );
}

export default function AddToCartButton({
  listingId,
  isOwn = false,
}: {
  listingId: string;
  isOwn?: boolean;
}) {
  const [state, formAction] = useActionState(addToCart, initial);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="listing_id" value={listingId} />
      <Button disabled={isOwn} label={isOwn ? "ประกาศของคุณ" : "ใส่ตะกร้า"} />
      {state.error && (
        <span className="text-[11px] text-red-600">{state.error}</span>
      )}
      {state.message && (
        <span className="text-[11px] text-green-600">{state.message}</span>
      )}
    </form>
  );
}
