import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/user";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { MOCK_BRANDS, MOCK_PRODUCTS } from "@/lib/mock-data";
import type {
  Company,
  Listing,
  Product,
  ProductOption,
  ProductionStatus,
  ProductType,
  Review,
} from "@/lib/types";

/** ใช้กับหน้ารายละเอียดและหน้าเปรียบเทียบ — ต้องการสเปกครบ */
const PRODUCT_FULL_SELECT = `
  id, slug, product_no, name, product_type, company_id, announced_date, release_year, status,
  msrp, market_price, thumbnail_url, summary, best_for, highlight, avg_rating, review_count,
  companies!inner ( id, name, slug, country, logo_url ),
  camera_specs ( * ),
  lens_specs ( * )
`;

/**
 * ใช้กับหน้าที่แสดงเป็นการ์ด/รายการ — ไม่ join ตารางสเปก
 * การ์ดสินค้าไม่ได้ใช้สเปกสักช่อง การลาก camera_specs มาด้วยทุกแถว
 * ทำให้ payload ใหญ่ขึ้นหลายเท่าโดยเปล่าประโยชน์
 */
const PRODUCT_LIST_SELECT = `
  id, slug, product_no, name, product_type, company_id, announced_date, release_year, status,
  msrp, market_price, thumbnail_url, summary, best_for, highlight, avg_rating, review_count,
  companies!inner ( id, name, slug, country, logo_url )
`;

/** เบาที่สุด — สำหรับ dropdown เลือกสินค้าและแถบกรอง */
const PRODUCT_OPTION_SELECT = `
  id, slug, name, product_no, product_type, msrp, market_price
`;

export type ProductFilters = {
  q?: string;
  type?: ProductType;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  /** สถานะการผลิต — ยังผลิตอยู่ / เลิกผลิตแล้ว */
  status?: ProductionStatus;
  /** เอาเฉพาะรุ่นที่เปิดตัวตั้งแต่ปีนี้เป็นต้นไป */
  minYear?: number;
  sort?: "popular" | "price_asc" | "price_desc" | "newest" | "rating";
};

/** ค่าที่ใช้เรียงตามความใหม่ — วันที่เต็มถ้ามี ไม่งั้นถือว่าเป็นต้นปีนั้น */
function sortableDate(p: Product) {
  if (p.announced_date) return new Date(p.announced_date).getTime();
  if (p.release_year) return new Date(p.release_year, 0, 1).getTime();
  return 0;
}

/** ราคาที่ใช้แสดง/เรียง — ใช้ราคากลางมือสองถ้ามี ไม่งั้นใช้ราคาป้าย */
export function displayPrice(p: Product) {
  return p.market_price ?? p.msrp ?? 0;
}

function applyFiltersLocally(items: Product[], f: ProductFilters) {
  let out = items;

  if (f.q) {
    const q = f.q.toLowerCase();
    out = out.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.product_no.toLowerCase().includes(q) ||
        (p.companies?.name ?? "").toLowerCase().includes(q)
    );
  }
  if (f.type) out = out.filter((p) => p.product_type === f.type);
  if (f.brands?.length)
    out = out.filter((p) => f.brands!.includes(p.companies?.slug ?? ""));
  if (f.minPrice !== undefined)
    out = out.filter((p) => displayPrice(p) >= f.minPrice!);
  if (f.maxPrice !== undefined)
    out = out.filter((p) => displayPrice(p) <= f.maxPrice!);
  if (f.minRating !== undefined)
    out = out.filter((p) => p.avg_rating >= f.minRating!);
  if (f.status) out = out.filter((p) => p.status === f.status);
  if (f.minYear !== undefined)
    out = out.filter((p) => {
      const y = p.release_year ?? (p.announced_date ? new Date(p.announced_date).getFullYear() : null);
      return y !== null && y >= f.minYear!;
    });

  const sorted = [...out];
  switch (f.sort) {
    case "price_asc":
      sorted.sort((a, b) => displayPrice(a) - displayPrice(b));
      break;
    case "price_desc":
      sorted.sort((a, b) => displayPrice(b) - displayPrice(a));
      break;
    case "newest":
      // เรียงตามวันที่เต็มถ้ามี ไม่มีก็ใช้ปีแทน (ข้อมูลนำเข้ามีแค่ปี)
      sorted.sort((a, b) => sortableDate(b) - sortableDate(a));
      break;
    case "rating":
      sorted.sort((a, b) => b.avg_rating - a.avg_rating);
      break;
    default:
      sorted.sort((a, b) => b.review_count - a.review_count);
  }
  return sorted;
}

/**
 * ตัดอักขระที่ทำให้ตัวกรองของ PostgREST เพี้ยน
 * ตัวกรองส่งไปเป็นข้อความคั่นด้วย , และ () — ถ้าผู้ใช้พิมพ์อักขระพวกนี้มา
 * มันจะถูกอ่านเป็นไวยากรณ์ของตัวกรองแทนที่จะเป็นคำค้น
 */
function safeTerm(q: string) {
  return q.replace(/[,()%\\]/g, " ").trim().slice(0, 60);
}

/** ประกอบเงื่อนไขกรอง+เรียงให้ฐานข้อมูลทำ แทนที่จะลากมากรองในโค้ด */
function buildProductQuery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  f: ProductFilters,
  select: string,
  withCount: boolean
) {
  let query = supabase
    .from("products")
    .select(select, withCount ? { count: "exact" } : undefined)
    .eq("is_deleted", false);

  if (f.q) {
    const term = safeTerm(f.q);
    if (term) {
      query = query.or(`name.ilike.%${term}%,product_no.ilike.%${term}%`);
    }
  }
  if (f.type) query = query.eq("product_type", f.type);
  if (f.brands?.length) query = query.in("companies.slug", f.brands);
  if (f.minRating !== undefined) query = query.gte("avg_rating", f.minRating);
  if (f.minPrice !== undefined) query = query.gte("display_price", f.minPrice);
  if (f.maxPrice !== undefined) query = query.lte("display_price", f.maxPrice);
  if (f.status) query = query.eq("status", f.status);
  // กรองด้วย released_on ไม่ใช่ release_year เพราะสินค้าบางรุ่นรู้วันที่เต็ม
  // แต่ไม่มี release_year — released_on ครอบทั้งสองแบบ
  if (f.minYear !== undefined)
    query = query.gte("released_on", `${f.minYear}-01-01`);

  switch (f.sort) {
    case "price_asc":
      query = query.order("display_price", { ascending: true, nullsFirst: false });
      break;
    case "price_desc":
      query = query.order("display_price", { ascending: false, nullsFirst: false });
      break;
    case "newest":
      query = query.order("released_on", { ascending: false, nullsFirst: false });
      break;
    case "rating":
      query = query.order("avg_rating", { ascending: false });
      break;
    default:
      query = query
        .order("review_count", { ascending: false })
        .order("avg_rating", { ascending: false });
  }

  return query.order("name", { ascending: true });
}

export type ProductPage = {
  items: Product[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

/**
 * หนึ่งหน้าของรายการสินค้า — กรอง เรียง และนับที่ฐานข้อมูล
 * ดึงเฉพาะแถวของหน้านั้นด้วย .range() ไม่ว่าแคตตาล็อกจะใหญ่แค่ไหน
 */
export const getProductsPage = cache(async function getProductsPage(
  f: ProductFilters = {},
  page = 1,
  perPage = 24
): Promise<ProductPage> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const from = (safePage - 1) * perPage;

  if (!isSupabaseConfigured) {
    const all = applyFiltersLocally(MOCK_PRODUCTS, f);
    return {
      items: all.slice(from, from + perPage),
      total: all.length,
      page: safePage,
      perPage,
      totalPages: Math.max(1, Math.ceil(all.length / perPage)),
    };
  }

  try {
    const supabase = await createClient();
    const { data, error, count } = await buildProductQuery(
      supabase,
      f,
      PRODUCT_LIST_SELECT,
      true
    ).range(from, from + perPage - 1);

    if (error) throw error;

    const total = count ?? 0;
    return {
      items: (data ?? []) as unknown as Product[],
      total,
      page: safePage,
      perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    };
  } catch {
    const all = applyFiltersLocally(MOCK_PRODUCTS, f);
    return {
      items: all.slice(from, from + perPage),
      total: all.length,
      page: safePage,
      perPage,
      totalPages: Math.max(1, Math.ceil(all.length / perPage)),
    };
  }
});

/** รายการสินค้าจำนวนจำกัด — ใช้กับแถวแนะนำหน้าแรก สินค้าที่เกี่ยวข้อง ฯลฯ */
export const getProducts = cache(async function getProducts(
  f: ProductFilters = {},
  limit = 24
): Promise<Product[]> {
  if (!isSupabaseConfigured)
    return applyFiltersLocally(MOCK_PRODUCTS, f).slice(0, limit);

  try {
    const supabase = await createClient();
    const { data, error } = await buildProductQuery(
      supabase,
      f,
      PRODUCT_LIST_SELECT,
      false
    ).limit(limit);
    if (error) throw error;

    return (data ?? []) as unknown as Product[];
  } catch {
    return applyFiltersLocally(MOCK_PRODUCTS, f).slice(0, limit);
  }
});

/** รายการสินค้าแบบเบา สำหรับ dropdown และแถบกรอง */
export const getProductOptions = cache(async function getProductOptions(
  type?: ProductType
): Promise<ProductOption[]> {
  if (!isSupabaseConfigured) {
    const list = type
      ? MOCK_PRODUCTS.filter((p) => p.product_type === type)
      : MOCK_PRODUCTS;
    return list.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      product_no: p.product_no,
      product_type: p.product_type,
      msrp: p.msrp,
      market_price: p.market_price,
    }));
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("products")
      .select(PRODUCT_OPTION_SELECT)
      .eq("is_deleted", false)
      .order("name");

    if (type) query = query.eq("product_type", type);

    const { data, error } = await query.limit(300);
    if (error) throw error;
    return (data ?? []) as unknown as ProductOption[];
  } catch {
    return [];
  }
});

/** สินค้าชิ้นเดียวแบบเบา — ใช้เลือกไว้ล่วงหน้าในช่องเลือกรุ่น */
export async function getProductOptionBySlug(
  slug: string
): Promise<ProductOption | null> {
  if (!isSupabaseConfigured) {
    const p = MOCK_PRODUCTS.find((x) => x.slug === slug);
    return p
      ? {
          id: p.id,
          slug: p.slug,
          name: p.name,
          product_no: p.product_no,
          product_type: p.product_type,
          msrp: p.msrp,
          market_price: p.market_price,
        }
      : null;
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select(PRODUCT_OPTION_SELECT)
      .eq("slug", slug)
      .eq("is_deleted", false)
      .maybeSingle();
    return (data as unknown as ProductOption) ?? null;
  } catch {
    return null;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured)
    return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_FULL_SELECT)
      .eq("slug", slug)
      .eq("is_deleted", false)
      .maybeSingle();
    if (error) throw error;
    return (data as unknown as Product) ?? null;
  } catch {
    return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null;
  }
}

/**
 * ดึงสินค้าตาม slug ที่ระบุ — ใช้ในหน้าเปรียบเทียบ
 * ต้องใช้ PRODUCT_FULL_SELECT เพราะหน้านี้เอาสเปกมาเทียบกันจริง ๆ
 * แต่ยิงเฉพาะ 2-4 รุ่นที่เลือก ไม่ใช่ดึงทั้งแคตตาล็อกมาแล้วค่อยกรอง
 */
export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  if (!slugs.length) return [];

  if (!isSupabaseConfigured) {
    const bySlug = new Map(MOCK_PRODUCTS.map((p) => [p.slug, p]));
    return slugs.map((s) => bySlug.get(s)).filter((p): p is Product => !!p);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_FULL_SELECT)
      .in("slug", slugs)
      .eq("is_deleted", false);
    if (error) throw error;

    // เรียงตามลำดับที่ผู้ใช้เลือกไว้ ไม่ใช่ลำดับที่ DB คืนมา
    const bySlug = new Map(
      ((data ?? []) as unknown as Product[]).map((p) => [p.slug, p])
    );
    return slugs.map((s) => bySlug.get(s)).filter((p): p is Product => !!p);
  } catch {
    const bySlug = new Map(MOCK_PRODUCTS.map((p) => [p.slug, p]));
    return slugs.map((s) => bySlug.get(s)).filter((p): p is Product => !!p);
  }
}

export async function getRelatedProducts(p: Product, limit = 4) {
  const all = await getProducts({ type: p.product_type });
  return all.filter((x) => x.id !== p.id).slice(0, limit);
}

export async function getBrands(): Promise<Company[]> {
  if (!isSupabaseConfigured) return MOCK_BRANDS as Company[];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("companies")
      .select("id, name, slug, country, logo_url")
      .order("name");
    if (error) throw error;
    return (data ?? []) as Company[];
  } catch {
    return MOCK_BRANDS as Company[];
  }
}

export async function getReviews(productId: string): Promise<Review[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reviews")
      .select(
        "id, product_id, author_id, rating, title, body, pros, cons, helpful_count, created_at, profiles ( display_name, avatar_url )"
      )
      .eq("product_id", productId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data ?? []) as unknown as Review[];
  } catch {
    return [];
  }
}

/** ประกาศขายมือสองของรุ่นนี้ */
export async function getListings(productId: string): Promise<Listing[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("listings")
      .select(
        "id, product_id, seller_id, title, price, quantity, condition, warranty_expire_date, shutter_count, description, province, created_at, profiles ( display_name, avatar_url )"
      )
      .eq("product_id", productId)
      .eq("status", "active")
      .eq("is_deleted", false)
      .order("price")
      .limit(20);
    if (error) throw error;
    return (data ?? []) as unknown as Listing[];
  } catch {
    return [];
  }
}

/** รายการโปรดของผู้ใช้ปัจจุบันสำหรับสินค้าชิ้นนี้ (ใช้ดึงราคาเป้าหมายมาแสดง) */
export async function getWishlistEntry(
  productId: string
): Promise<{ target_price: number | null } | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const user = await getAuthUser();
    if (!user) return null;

    const supabase = await createClient();
    const { data } = await supabase
      .from("wishlist_items")
      .select("target_price, wishlists!inner ( user_id )")
      .eq("product_id", productId)
      .eq("wishlists.user_id", user.id)
      .maybeSingle();

    return data ? { target_price: data.target_price as number | null } : null;
  } catch {
    return null;
  }
}

/**
 * ผู้ใช้ปัจจุบัน + profile (null ถ้ายังไม่ล็อกอิน)
 * แคชต่อ 1 request — header กับตัวหน้าเรียกซ้ำได้โดยไม่ยิง DB ใหม่
 */
export const getCurrentUser = cache(async () => {
  const user = await getAuthUser();
  if (!user) return null;

  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    return { user, profile };
  } catch {
    return null;
  }
});
