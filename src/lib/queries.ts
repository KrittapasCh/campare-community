import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { MOCK_BRANDS, MOCK_PRODUCTS } from "@/lib/mock-data";
import type { Company, Listing, Product, ProductType, Review } from "@/lib/types";

const PRODUCT_SELECT = `
  id, slug, product_no, name, product_type, company_id, announced_date, status,
  msrp, market_price, thumbnail_url, summary, best_for, highlight, avg_rating, review_count,
  companies ( id, name, slug, country, logo_url ),
  camera_specs ( * ),
  lens_specs ( * )
`;

export type ProductFilters = {
  q?: string;
  type?: ProductType;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: "popular" | "price_asc" | "price_desc" | "newest" | "rating";
};

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

  const sorted = [...out];
  switch (f.sort) {
    case "price_asc":
      sorted.sort((a, b) => displayPrice(a) - displayPrice(b));
      break;
    case "price_desc":
      sorted.sort((a, b) => displayPrice(b) - displayPrice(a));
      break;
    case "newest":
      sorted.sort((a, b) =>
        (b.announced_date ?? "").localeCompare(a.announced_date ?? "")
      );
      break;
    case "rating":
      sorted.sort((a, b) => b.avg_rating - a.avg_rating);
      break;
    default:
      sorted.sort((a, b) => b.review_count - a.review_count);
  }
  return sorted;
}

export async function getProducts(f: ProductFilters = {}): Promise<Product[]> {
  if (!isSupabaseConfigured) return applyFiltersLocally(MOCK_PRODUCTS, f);

  try {
    const supabase = await createClient();
    let query = supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_deleted", false);

    if (f.q) query = query.ilike("name", `%${f.q}%`);
    if (f.type) query = query.eq("product_type", f.type);
    if (f.minRating !== undefined) query = query.gte("avg_rating", f.minRating);

    const { data, error } = await query.limit(200);
    if (error) throw error;

    // filter ราคา/แบรนด์ ทำฝั่ง app เพราะราคาใช้ coalesce(market_price, msrp)
    return applyFiltersLocally((data ?? []) as unknown as Product[], {
      ...f,
      q: undefined,
      type: undefined,
      minRating: undefined,
    });
  } catch {
    return applyFiltersLocally(MOCK_PRODUCTS, f);
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured)
    return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .eq("is_deleted", false)
      .maybeSingle();
    if (error) throw error;
    return (data as unknown as Product) ?? null;
  } catch {
    return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null;
  }
}

export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  if (!slugs.length) return [];
  const all = await getProducts();
  const bySlug = new Map(all.map((p) => [p.slug, p]));
  return slugs.map((s) => bySlug.get(s)).filter((p): p is Product => !!p);
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

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

/** ผู้ใช้ปัจจุบัน + profile (null ถ้ายังไม่ล็อกอิน) */
export async function getCurrentUser() {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    return { user, profile };
  } catch {
    return null;
  }
}
