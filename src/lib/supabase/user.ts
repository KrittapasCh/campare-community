import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * ดึง user ปัจจุบันแบบแคชต่อ 1 request
 *
 * ทำไมต้องแคช: supabase.auth.getUser() ยิงเน็ตไปหา Supabase ทุกครั้งที่เรียก
 * หน้าเดียวเรียกหลายที่ (header, badge ตะกร้า, กระดิ่ง, ตัวหน้าเอง)
 * ถ้าไม่แคชก็จะยิง 4-5 รอบต่อการโหลด 1 หน้า
 *
 * cache() ของ React ทำให้เรียกซ้ำในคำขอเดียวกันได้ผลลัพธ์เดิมโดยไม่ยิงใหม่
 */
export const getAuthUser = cache(async () => {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
});
