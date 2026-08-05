import "server-only";

import { isSupabaseConfigured } from "@/lib/supabase/env";

export type OAuthProvider = "google" | "facebook";

/**
 * ถาม Supabase ว่า provider ตัวไหนเปิดใช้งานอยู่บ้าง
 * เพื่อจะได้ซ่อนปุ่มที่กดแล้วพัง — พอไปเปิดใน Dashboard ปุ่มจะโผล่เอง
 *
 * endpoint /auth/v1/settings เป็น public (ต้องมี apikey header)
 */
export async function getEnabledOAuthProviders(): Promise<OAuthProvider[]> {
  if (!isSupabaseConfigured) return [];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  try {
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      // แคชไว้ 5 นาที ไม่ต้องยิงทุก request
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      external?: Record<string, boolean>;
    };

    return (["google", "facebook"] as const).filter(
      (p) => data.external?.[p] === true
    );
  } catch {
    // ยิงไม่ติดก็ถือว่าไม่มี provider — ซ่อนปุ่มไว้ปลอดภัยกว่า
    return [];
  }
}
