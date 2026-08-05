import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * เช็คสิทธิ์ admin ก่อนเข้าหน้าในกลุ่ม /admin
 * ป้องกันสองชั้น: ตรงนี้ (UI) + RLS ฝั่ง DB (public.is_admin())
 */
export async function requireAdmin() {
  if (!isSupabaseConfigured) redirect("/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") redirect("/");

  return { supabase, user, profile };
}

export type AdminStats = {
  pendingPhotos: number;
  pendingPosts: number;
  pendingReports: number;
  members: number;
  products: number;
  activeListings: number;
  orders: number;
};

const HEAD = { count: "exact" as const, head: true };

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();

  const [photos, posts, reports, members, products, listings, orders] =
    await Promise.all([
      supabase
        .from("gallery_photos")
        .select("id", HEAD)
        .eq("status", "pending")
        .eq("is_deleted", false),
      supabase
        .from("community_posts")
        .select("id", HEAD)
        .eq("status", "pending")
        .eq("is_deleted", false),
      supabase.from("reports").select("id", HEAD).eq("status", "pending"),
      supabase.from("profiles").select("id", HEAD).eq("is_deleted", false),
      supabase.from("products").select("id", HEAD).eq("is_deleted", false),
      supabase
        .from("listings")
        .select("id", HEAD)
        .eq("status", "active")
        .eq("is_deleted", false),
      supabase.from("orders").select("id", HEAD),
    ]);

  return {
    pendingPhotos: photos.count ?? 0,
    pendingPosts: posts.count ?? 0,
    pendingReports: reports.count ?? 0,
    members: members.count ?? 0,
    products: products.count ?? 0,
    activeListings: listings.count ?? 0,
    orders: orders.count ?? 0,
  };
}
