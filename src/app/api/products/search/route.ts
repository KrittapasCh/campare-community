import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import type { ProductOption, ProductType } from "@/lib/types";

/**
 * ค้นหาสินค้าสำหรับช่องเลือกรุ่น
 *
 * ทำไมต้องมี endpoint นี้: แคตตาล็อกมีสินค้าหลักพันรุ่น การส่งทั้งหมด
 * ไปให้เบราว์เซอร์แล้วใส่ใน <select> ทำให้หน้าหนักและเลือกยาก
 * ให้ฐานข้อมูลค้นแล้วส่งกลับมาแค่ 20 รายการที่ตรงที่สุดแทน
 */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 60);
  const type = request.nextUrl.searchParams.get("type") as ProductType | null;

  if (!isSupabaseConfigured) {
    const filtered = MOCK_PRODUCTS.filter(
      (p) =>
        (!type || p.product_type === type) &&
        (!q || p.name.toLowerCase().includes(q.toLowerCase()))
    ).slice(0, 20);
    return NextResponse.json({ items: filtered });
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("products")
      .select("id, slug, name, product_no, product_type, msrp, market_price")
      .eq("is_deleted", false);

    if (type) query = query.eq("product_type", type);

    if (q) {
      // ตัดอักขระที่เป็นไวยากรณ์ของตัวกรอง ไม่งั้นคำค้นจะถูกอ่านผิด
      const term = q.replace(/[,()%\\]/g, " ").trim();
      if (term) {
        query = query.or(`name.ilike.%${term}%,product_no.ilike.%${term}%`);
      }
    }

    const { data, error } = await query
      .order("review_count", { ascending: false })
      .order("name", { ascending: true })
      .limit(20);

    if (error) throw error;
    return NextResponse.json({ items: (data ?? []) as ProductOption[] });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
