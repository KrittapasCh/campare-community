"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type AuthState } from "@/app/auth/actions";
import SubmitButton from "@/components/auth/submit-button";

const initial: AuthState = {};

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(login, initial);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <div>
        <label htmlFor="email" className="text-sm font-medium">
          อีเมล
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="password" className="text-sm font-medium">
            รหัสผ่าน
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-ink-500 hover:text-brand-600"
          >
            ลืมรหัสผ่าน
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
          placeholder="••••••••"
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="กำลังเข้าสู่ระบบ…">เข้าสู่ระบบ</SubmitButton>
    </form>
  );
}
