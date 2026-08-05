"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register, type AuthState } from "@/app/auth/actions";
import SubmitButton from "@/components/auth/submit-button";

const initial: AuthState = {};

const field =
  "mt-1 w-full rounded-lg border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400";

export default function RegisterForm() {
  const [state, formAction] = useActionState(register, initial);

  if (state.message) {
    return (
      <div className="rounded-card border border-brand-200 bg-brand-50 p-5 text-center">
        <p className="text-2xl">✓</p>
        <p className="mt-2 font-semibold text-brand-800">สมัครสมาชิกสำเร็จ</p>
        <p className="mt-1 text-sm text-brand-900">{state.message}</p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-lg bg-brand-400 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-500"
        >
          ไปหน้าเข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="display_name" className="text-sm font-medium">
          ชื่อที่ใช้แสดง
        </label>
        <input id="display_name" name="display_name" required className={field} placeholder="เช่น Krit" />
      </div>

      <div>
        <label htmlFor="email" className="text-sm font-medium">อีเมล</label>
        <input id="email" name="email" type="email" autoComplete="email" required className={field} placeholder="you@example.com" />
      </div>

      <div>
        <label htmlFor="phone" className="text-sm font-medium">
          เบอร์โทร <span className="text-ink-400">(ไม่บังคับ)</span>
        </label>
        <input id="phone" name="phone" type="tel" className={field} placeholder="08x-xxx-xxxx" />
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-medium">รหัสผ่าน</label>
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className={field} placeholder="อย่างน้อย 8 ตัวอักษร" />
      </div>

      <div>
        <label htmlFor="confirm" className="text-sm font-medium">ยืนยันรหัสผ่าน</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required className={field} placeholder="พิมพ์รหัสผ่านอีกครั้ง" />
      </div>

      <label className="flex items-start gap-2 text-sm text-ink-600">
        <input type="checkbox" name="accept" className="mt-0.5 accent-brand-400" />
        ยอมรับข้อกำหนดและเงื่อนไขการใช้งาน
      </label>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="กำลังสมัคร…">สมัครสมาชิก</SubmitButton>
    </form>
  );
}
