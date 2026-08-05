import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import ProductThumb from "@/components/product-thumb";
import CommentForm from "@/components/gallery/comment-form";
import { getCurrentUser } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "ภาพตัวอย่าง" };

type Params = Promise<{ id: string }>;

export default async function PhotoDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  if (!isSupabaseConfigured) notFound();

  const supabase = await createClient();

  const [photoRes, commentsRes, session] = await Promise.all([
    supabase
      .from("gallery_photos")
      .select(
        `id, title, image_url, original_url, shot_iso, shot_aperture, shot_shutter,
         shot_focal_mm, taken_at, created_at, status,
         profiles ( display_name ),
         products!gallery_photos_product_id_fkey ( name, slug ),
         lens:products!gallery_photos_lens_id_fkey ( name, slug )`
      )
      .eq("id", id)
      .eq("is_deleted", false)
      .maybeSingle(),
    supabase
      .from("comments")
      .select("id, body, created_at, profiles ( display_name )")
      .eq("target_type", "photo")
      .eq("target_id", id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true }),
    getCurrentUser(),
  ]);

  if (!photoRes.data) notFound();

  const photo = photoRes.data as unknown as {
    id: string;
    title: string | null;
    image_url: string;
    original_url: string | null;
    shot_iso: number | null;
    shot_aperture: number | null;
    shot_shutter: string | null;
    shot_focal_mm: number | null;
    taken_at: string | null;
    created_at: string;
    status: string;
    profiles: { display_name: string } | null;
    products: { name: string; slug: string } | null;
    lens: { name: string; slug: string } | null;
  };

  const comments = (commentsRes.data ?? []) as unknown as {
    id: string;
    body: string;
    created_at: string;
    profiles: { display_name: string } | null;
  }[];

  const settings = [
    photo.shot_focal_mm && { label: "ทางยาวโฟกัส", value: `${photo.shot_focal_mm} มม.` },
    photo.shot_aperture && { label: "รูรับแสง", value: `f/${photo.shot_aperture}` },
    photo.shot_shutter && { label: "ชัตเตอร์", value: photo.shot_shutter },
    photo.shot_iso && { label: "ISO", value: String(photo.shot_iso) },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/gallery" className="text-sm text-ink-500 hover:text-brand-600">
        ← กลับไปแกลเลอรี
      </Link>

      {photo.status !== "approved" && (
        <p className="mt-3 rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-800">
          ภาพนี้ยังรอผู้ดูแลอนุมัติ — คนอื่นยังมองไม่เห็น
        </p>
      )}

      <div className="mt-4 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative aspect-4/3 overflow-hidden rounded-card border border-ink-100 bg-ink-50">
          <ProductThumb
            src={photo.image_url}
            alt={photo.title ?? "ภาพตัวอย่าง"}
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
          />
        </div>

        <div>
          <h1 className="text-2xl font-bold">
            {photo.title ?? "ไม่มีชื่อภาพ"}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            โดย {photo.profiles?.display_name ?? "ผู้ใช้"} ·{" "}
            {formatDate(photo.taken_at ?? photo.created_at)}
          </p>

          {(photo.products || photo.lens) && (
            <div className="mt-4 space-y-2 rounded-card border border-ink-100 p-4 text-sm">
              {photo.products && (
                <p>
                  <span className="text-ink-500">กล้อง </span>
                  <Link
                    href={`/product/${photo.products.slug}`}
                    className="font-medium text-brand-600 hover:underline"
                  >
                    {photo.products.name}
                  </Link>
                </p>
              )}
              {photo.lens && (
                <p>
                  <span className="text-ink-500">เลนส์ </span>
                  <Link
                    href={`/product/${photo.lens.slug}`}
                    className="font-medium text-brand-600 hover:underline"
                  >
                    {photo.lens.name}
                  </Link>
                </p>
              )}
            </div>
          )}

          {settings.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold">ค่าที่ใช้ถ่าย</p>
              <dl className="mt-2 grid grid-cols-2 gap-2">
                {settings.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-lg bg-ink-50 px-3 py-2 text-sm"
                  >
                    <dt className="text-xs text-ink-500">{s.label}</dt>
                    <dd className="font-medium">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {photo.original_url && (
            <a
              href={photo.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium hover:border-brand-300 hover:text-brand-600"
            >
              ดาวน์โหลดไฟล์ต้นฉบับ ↗
            </a>
          )}
        </div>
      </div>

      {/* คอมเมนต์ */}
      <section className="mt-12 max-w-2xl">
        <h2 className="text-lg font-bold">
          ความคิดเห็น{" "}
          <span className="text-sm font-normal text-ink-500">
            ({comments.length})
          </span>
        </h2>

        <div className="mt-4">
          <CommentForm photoId={photo.id} signedIn={!!session} />
        </div>

        {comments.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">
            ยังไม่มีความคิดเห็น เป็นคนแรกก็ได้
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="rounded-card border border-ink-100 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    {c.profiles?.display_name ?? "ผู้ใช้"}
                  </p>
                  <span className="text-xs text-ink-400">
                    {formatDate(c.created_at)}
                  </span>
                </div>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-600">
                  {c.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
