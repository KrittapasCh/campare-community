"use client";

import { useActionState } from "react";
import { updateProfile, type AuthState } from "@/app/auth/actions";
import SubmitButton from "@/components/auth/submit-button";
import type { Profile } from "@/lib/types";

const initial: AuthState = {};

const field =
  "mt-1 w-full rounded-lg border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400";

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction] = useActionState(updateProfile, initial);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="display_name" className="text-sm font-medium">
          ชื่อที่ใช้แสดง
        </label>
        <input
          id="display_name"
          name="display_name"
          defaultValue={profile.display_name ?? ""}
          required
          className={field}
        />
      </div>

      <div>
        <label className="text-sm font-medium">อีเมล</label>
        <input
          value={profile.email ?? ""}
          disabled
          className={`${field} bg-ink-50 text-ink-500`}
        />
        <p className="mt-1 text-xs text-ink-400">
          เปลี่ยนอีเมลต้องยืนยันผ่านลิงก์ในอีเมลใหม่
        </p>
      </div>

      <div>
        <label htmlFor="phone" className="text-sm font-medium">
          เบอร์โทร
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={profile.phone ?? ""}
          className={field}
        />
      </div>

      <div>
        <label htmlFor="bio" className="text-sm font-medium">
          แนะนำตัวสั้น ๆ
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={profile.bio ?? ""}
          className={field}
          placeholder="เช่น ถ่ายสตรีทเป็นหลัก ใช้ Fuji มา 3 ปี"
        />
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

      <SubmitButton pendingText="กำลังบันทึก…">บันทึกข้อมูล</SubmitButton>
    </form>
  );
}
