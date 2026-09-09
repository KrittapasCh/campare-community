"use client";

import { useActionState, useState } from "react";
import { placeOrder, type CheckoutState } from "@/app/checkout/actions";
import SubmitButton from "@/components/auth/submit-button";

const initial: CheckoutState = {};

const METHODS = [
  { value: "mobile_banking", label: "Mobile Banking", icon: "📱", note: "โอนผ่านแอปธนาคาร" },
  { value: "cash", label: "เงินสด", icon: "💵", note: "ชำระตอนนัดรับ" },
  { value: "credit_debit_card", label: "บัตรเครดิต/เดบิต", icon: "💳", note: "Visa · Mastercard" },
  { value: "coin", label: "Shopcam Coin", icon: "🪙", note: "เหรียญในระบบ" },
] as const;

export default function CheckoutForm() {
  const [state, formAction] = useActionState(placeOrder, initial);
  const [method, setMethod] = useState<string>("mobile_banking");

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="payment_method" value={method} />

      <section>
        <h2 className="font-bold">วิธีชำระเงิน</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMethod(m.value)}
              aria-pressed={method === m.value}
              className={
                "flex items-start gap-3 rounded-card border p-4 text-left transition " +
                (method === m.value
                  ? "border-brand-400 bg-brand-50 ring-1 ring-brand-200"
                  : "border-ink-200 hover:border-brand-300")
              }
            >
              <span className="text-2xl leading-none">{m.icon}</span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{m.label}</span>
                <span className="block text-xs text-ink-500">{m.note}</span>
              </span>
              <span
                className={
                  "ml-auto mt-1 grid size-4 shrink-0 place-items-center rounded-full border " +
                  (method === m.value
                    ? "border-brand-400 bg-brand-400"
                    : "border-ink-300")
                }
              >
                {method === m.value && (
                  <span className="size-1.5 rounded-full bg-white" />
                )}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-bold">ที่อยู่จัดส่ง</h2>
        <textarea
          name="address"
          rows={4}
          required
          minLength={10}
          className="mt-3 w-full rounded-lg border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
          placeholder={"ชื่อผู้รับ เบอร์โทร\nบ้านเลขที่ ถนน แขวง/ตำบล\nเขต/อำเภอ จังหวัด รหัสไปรษณีย์"}
        />
        <p className="mt-1 text-xs text-ink-400">
          ถ้าเลือกชำระเงินสดแบบนัดรับ ให้ระบุจุดนัดพบแทนได้
        </p>
      </section>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="กำลังยืนยันคำสั่งซื้อ…">
        ยืนยันคำสั่งซื้อ
      </SubmitButton>
    </form>
  );
}
