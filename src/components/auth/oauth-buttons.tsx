"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OAuthProvider } from "@/lib/auth-settings";

const LABEL: Record<OAuthProvider, { name: string; mark: string }> = {
  google: { name: "Google", mark: "G" },
  facebook: { name: "Facebook", mark: "f" },
};

export default function OAuthButtons({
  providers,
  next = "/profile",
}: {
  providers: OAuthProvider[];
  next?: string;
}) {
  const [busy, setBusy] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ยังไม่ได้เปิด provider ไหนเลย — ไม่ต้องแสดงอะไร
  if (providers.length === 0) return null;

  async function signIn(provider: OAuthProvider) {
    setBusy(provider);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setBusy(null);
      setError(
        error.message.includes("not enabled")
          ? `ยังไม่ได้เปิดใช้งาน ${LABEL[provider].name} ใน Supabase`
          : `เข้าสู่ระบบไม่สำเร็จ: ${error.message}`
      );
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs text-ink-400">
        <span className="h-px flex-1 bg-ink-100" />
        หรือ
        <span className="h-px flex-1 bg-ink-100" />
      </div>

      <div className="space-y-2">
        {providers.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => signIn(p)}
            disabled={!!busy}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-ink-200 py-2.5 text-sm font-medium hover:border-brand-300 disabled:opacity-60"
          >
            <span className="text-base font-bold">{LABEL[p].mark}</span>
            {busy === p
              ? `กำลังพาไป ${LABEL[p].name}…`
              : `เข้าสู่ระบบด้วย ${LABEL[p].name}`}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
