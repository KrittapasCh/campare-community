"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ProductType } from "@/lib/types";

export type ProductFormState = { error?: string; message?: string };

const TYPES: ProductType[] = [
  "camera",
  "lens",
  "grip",
  "tripod",
  "filter",
  "strap",
];

async function assertAdmin() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") return null;
  return supabase;
}

const num = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const str = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s || null;
};

const list = (v: FormDataEntryValue | null) =>
  String(v ?? "")
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);

/** สร้างหรืออัปเดตสินค้า + แถวสเปกตามประเภท */
export async function saveProduct(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "ต้องเป็นผู้ดูแลระบบเท่านั้น" };

  const id = str(formData.get("id"));
  const productType = String(formData.get("product_type") ?? "") as ProductType;
  const slug = str(formData.get("slug"));
  const productNo = str(formData.get("product_no"));
  const name = str(formData.get("name"));
  const companyId = str(formData.get("company_id"));

  if (!name) return { error: "ใส่ชื่อสินค้า" };
  if (!slug) return { error: "ใส่ slug (ใช้เป็น URL เช่น sony-a7c-ii)" };
  if (!/^[a-z0-9-]+$/.test(slug))
    return { error: "slug ใช้ได้แค่ a-z 0-9 และขีดกลาง" };
  if (!productNo) return { error: "ใส่รหัสสินค้า" };
  if (!companyId) return { error: "เลือกแบรนด์" };
  if (!TYPES.includes(productType)) return { error: "เลือกประเภทสินค้า" };

  const payload = {
    slug,
    product_no: productNo,
    name,
    product_type: productType,
    company_id: companyId,
    announced_date: str(formData.get("announced_date")),
    status: String(formData.get("status") ?? "in_production"),
    msrp: num(formData.get("msrp")),
    summary: str(formData.get("summary")),
    best_for: list(formData.get("best_for")),
    highlight: list(formData.get("highlight")),
    thumbnail_url: str(formData.get("thumbnail_url")),
  };

  let productId = id;

  if (id) {
    const { error } = await supabase.from("products").update(payload).eq("id", id);
    if (error) return { error: `บันทึกไม่สำเร็จ: ${error.message}` };
  } else {
    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select("id")
      .single();
    if (error)
      return {
        error: error.message.includes("duplicate")
          ? "slug หรือรหัสสินค้านี้ถูกใช้ไปแล้ว"
          : `สร้างสินค้าไม่สำเร็จ: ${error.message}`,
      };
    productId = data.id;
  }

  if (!productId) return { error: "ไม่พบ id ของสินค้า" };

  // สเปกตามประเภท — ใช้ upsert เพราะเป็นความสัมพันธ์ 1:1
  if (productType === "camera") {
    await supabase.from("camera_specs").upsert({
      product_id: productId,
      body_type: str(formData.get("body_type")),
      sensor_size: str(formData.get("sensor_size")),
      sensor_type: str(formData.get("sensor_type")),
      megapixels: num(formData.get("megapixels")),
      max_resolution: str(formData.get("max_resolution")),
      iso_min: num(formData.get("iso_min")),
      iso_max: num(formData.get("iso_max")),
      shutter_min: str(formData.get("shutter_min")),
      shutter_max: str(formData.get("shutter_max")),
      fps_burst: num(formData.get("fps_burst")),
      video_max: str(formData.get("video_max")),
      ibis: formData.get("ibis") === "on",
      weather_sealed: formData.get("weather_sealed") === "on",
      screen_type: str(formData.get("screen_type")),
      viewfinder: str(formData.get("viewfinder")),
      battery_shots: num(formData.get("battery_shots")),
      weight_g: num(formData.get("weight_g")),
      dimensions_mm: str(formData.get("dimensions_mm")),
    });
  }

  if (productType === "lens") {
    await supabase.from("lens_specs").upsert({
      product_id: productId,
      focal_min_mm: num(formData.get("focal_min_mm")),
      focal_max_mm: num(formData.get("focal_max_mm")),
      aperture_max: num(formData.get("aperture_max")),
      aperture_min: num(formData.get("aperture_min")),
      mount: str(formData.get("mount")),
      is_prime: formData.get("is_prime") === "on",
      stabilization: formData.get("stabilization") === "on",
      filter_thread_mm: num(formData.get("filter_thread_mm")),
      min_focus_cm: num(formData.get("min_focus_cm")),
      weight_g: num(formData.get("lens_weight_g")),
    });
  }

  revalidatePath("/admin/products");
  revalidatePath("/category");
  revalidatePath(`/product/${slug}`);
  redirect("/admin/products?saved=1");
}

export async function toggleProductDeleted(formData: FormData) {
  const supabase = await assertAdmin();
  if (!supabase) return;

  const id = String(formData.get("id") ?? "");
  const deleted = formData.get("deleted") === "true";
  if (!id) return;

  await supabase.from("products").update({ is_deleted: deleted }).eq("id", id);

  revalidatePath("/admin/products");
  revalidatePath("/category");
}
