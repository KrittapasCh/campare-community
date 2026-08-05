/** เช็คว่า .env.local ถูกตั้งค่าครบหรือยัง — ใช้กันไม่ให้ build พังตอนยังไม่ได้ต่อ Supabase */
export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
