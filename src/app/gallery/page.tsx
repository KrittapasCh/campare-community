import Link from "next/link";
import type { Metadata } from "next";

import ProductThumb from "@/components/product-thumb";
import { getCurrentUser, getProductOptions } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "แกลเลอรีภาพตัวอย่าง" };

type SearchParams = Promise<{ product?: string; submitted?: string }>;

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">แกลเลอรีภาพตัวอย่าง</h1>
        <p className="mt-3 text-ink-500">หน้านี้ต้องเชื่อม Supabase ก่อน</p>
      </div>
    );
  }

  const supabase = await createClient();
  const [session, products] = await Promise.all([
    getCurrentUser(),
    getProductOptions("camera"),
  ]);

  let query = supabase
    .from("gallery_photos")
    .select(
      "id, title, image_url, shot_iso, shot_aperture, shot_shutter, shot_focal_mm, created_at, profiles ( display_name ), products!gallery_photos_product_id_fkey ( name, slug )"
    )
    .eq("status", "approved")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(60);

  if (sp.product) query = query.eq("product_id", sp.product);

  const { data } = await query;

  const photos = (data ?? []) as unknown as {
    id: string;
    title: string | null;
    image_url: string;
    shot_iso: number | null;
    shot_aperture: number | null;
    shot_shutter: string | null;
    shot_focal_mm: number | null;
    created_at: string;
    profiles: { display_name: string } | null;
    products: { name: string; slug: string } | null;
  }[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">แกลเลอรีภาพตัวอย่าง</h1>
          <p className="mt-1 text-sm text-ink-500">
            ภาพจริงจากกล้องแต่ละรุ่น พร้อมค่าที่ใช้ถ่าย —
            อยากรู้ว่ารุ่นไหนให้ภาพแบบไหน ดูจากที่นี่
          </p>
        </div>
        <Link
          href={session ? "/gallery/upload" : "/login?next=/gallery/upload"}
          className="rounded-lg bg-brand-400 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-500"
        >
          + อัปโหลดภาพ
        </Link>
      </div>

      {sp.submitted && (
        <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          ส่งภาพเรียบร้อย — รอผู้ดูแลอนุมัติก่อนจะแสดงในแกลเลอรี
        </p>
      )}

      {/* กรองตามรุ่นกล้อง */}
      <div className="scroll-slim mt-6 flex gap-2 overflow-x-auto pb-2">
        <Link
          href="/gallery"
          className={
            "shrink-0 rounded-full border px-4 py-1.5 text-sm " +
            (!sp.product
              ? "border-brand-400 bg-brand-50 text-brand-700"
              : "border-ink-200 hover:border-brand-300")
          }
        >
          ทั้งหมด
        </Link>
        {products.slice(0, 20).map((p) => (
          <Link
            key={p.id}
            href={`/gallery?product=${p.id}`}
            className={
              "shrink-0 rounded-full border px-4 py-1.5 text-sm " +
              (sp.product === p.id
                ? "border-brand-400 bg-brand-50 text-brand-700"
                : "border-ink-200 hover:border-brand-300")
            }
          >
            {p.name}
          </Link>
        ))}
      </div>

      {photos.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-ink-200 py-20 text-center">
          <p className="text-4xl">📷</p>
          <p className="mt-3 font-medium">ยังไม่มีภาพในแกลเลอรี</p>
          <p className="mt-1 text-sm text-ink-500">
            อัปโหลดภาพแรกได้เลย — ผู้ดูแลจะอนุมัติแล้วขึ้นแสดงที่นี่
          </p>
        </div>
      ) : (
        <div className="mt-6 columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
          {photos.map((photo) => (
            <Link
              key={photo.id}
              href={`/gallery/${photo.id}`}
              className="group mb-4 block break-inside-avoid overflow-hidden rounded-card border border-ink-100 transition hover:border-brand-300 hover:shadow-lg"
            >
              <div className="relative aspect-4/3 bg-ink-50">
                <ProductThumb
                  src={photo.image_url}
                  alt={photo.title ?? "ภาพตัวอย่าง"}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="transition duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-3">
                <p className="line-clamp-1 text-sm font-medium">
                  {photo.title ?? "ไม่มีชื่อภาพ"}
                </p>
                {photo.products && (
                  <p className="mt-0.5 text-xs text-brand-600">
                    {photo.products.name}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-ink-400">
                  {[
                    photo.shot_focal_mm && `${photo.shot_focal_mm}mm`,
                    photo.shot_aperture && `f/${photo.shot_aperture}`,
                    photo.shot_shutter,
                    photo.shot_iso && `ISO ${photo.shot_iso}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="mt-1 text-[11px] text-ink-400">
                  โดย {photo.profiles?.display_name ?? "ผู้ใช้"} ·{" "}
                  {formatDate(photo.created_at)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
