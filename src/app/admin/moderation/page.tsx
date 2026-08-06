import Link from "next/link";
import ProductThumb from "@/components/product-thumb";
import { moderatePhoto, moderatePost } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";

type SearchParams = Promise<{ tab?: string }>;

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const tab = sp.tab === "posts" ? "posts" : "photos";

  const [photosRes, postsRes] = await Promise.all([
    supabase
      .from("gallery_photos")
      // ต้องระบุชื่อ FK ให้ชัด เพราะ gallery_photos ชี้ไป products ได้ 2 ทาง
      // (product_id = กล้อง, lens_id = เลนส์) ถ้าเขียนแค่ products(...) จะ error
      .select(
        "id, title, image_url, shot_iso, shot_aperture, shot_shutter, shot_focal_mm, created_at, profiles ( display_name ), products!gallery_photos_product_id_fkey ( name, slug )"
      )
      .eq("status", "pending")
      .eq("is_deleted", false)
      .order("created_at", { ascending: true }),
    supabase
      .from("community_posts")
      .select(
        "id, title, body, tags, is_question, created_at, profiles ( display_name ), products ( name, slug )"
      )
      .eq("status", "pending")
      .eq("is_deleted", false)
      .order("created_at", { ascending: true }),
  ]);

  const photos = (photosRes.data ?? []) as unknown as {
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

  const posts = (postsRes.data ?? []) as unknown as {
    id: string;
    title: string;
    body: string;
    tags: string[] | null;
    is_question: boolean;
    created_at: string;
    profiles: { display_name: string } | null;
    products: { name: string; slug: string } | null;
  }[];

  return (
    <>
      <h1 className="text-2xl font-bold">ตรวจสอบเนื้อหา</h1>
      <p className="mt-1 text-sm text-ink-500">
        เนื้อหาที่ผู้ใช้ส่งเข้ามาจะอยู่สถานะ <code className="rounded bg-ink-100 px-1 font-mono text-xs">pending</code>{" "}
        จนกว่าผู้ดูแลจะอนุมัติ ถึงจะแสดงบนเว็บ
      </p>

      {/* แท็บ */}
      <div className="mt-5 flex gap-2 border-b border-ink-100">
        {[
          ["photos", "รูปแกลเลอรี", photos.length],
          ["posts", "โพสต์คอมมูนิตี้", posts.length],
        ].map(([value, label, n]) => (
          <Link
            key={value as string}
            href={`/admin/moderation?tab=${value}`}
            className={
              "-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition " +
              (tab === value
                ? "border-brand-400 text-brand-600"
                : "border-transparent text-ink-500 hover:text-ink-800")
            }
          >
            {label as string}
            <span className="rounded-full bg-ink-100 px-2 text-xs">
              {n as number}
            </span>
          </Link>
        ))}
      </div>

      {tab === "photos" ? (
        photos.length === 0 ? (
          <Empty text="ไม่มีรูปรออนุมัติ" />
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {photos.map((p) => (
              <article
                key={p.id}
                className="overflow-hidden rounded-card border border-ink-100"
              >
                <div className="relative aspect-4/3 bg-ink-50">
                  <ProductThumb
                    src={p.image_url}
                    alt={p.title ?? "รูปตัวอย่าง"}
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
                <div className="p-4">
                  <p className="font-medium">{p.title ?? "ไม่มีชื่อภาพ"}</p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    โดย {p.profiles?.display_name ?? "ผู้ใช้"} ·{" "}
                    {formatDate(p.created_at)}
                  </p>
                  {p.products && (
                    <Link
                      href={`/product/${p.products.slug}`}
                      className="mt-1 inline-block text-xs text-brand-600 hover:underline"
                    >
                      ถ่ายด้วย {p.products.name}
                    </Link>
                  )}
                  <p className="mt-2 text-xs text-ink-500">
                    {[
                      p.shot_focal_mm && `${p.shot_focal_mm}mm`,
                      p.shot_aperture && `f/${p.shot_aperture}`,
                      p.shot_shutter,
                      p.shot_iso && `ISO ${p.shot_iso}`,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "ไม่ได้ระบุค่าที่ใช้ถ่าย"}
                  </p>

                  <Decision action={moderatePhoto} id={p.id} />
                </div>
              </article>
            ))}
          </div>
        )
      ) : posts.length === 0 ? (
        <Empty text="ไม่มีโพสต์รออนุมัติ" />
      ) : (
        <ul className="mt-5 space-y-4">
          {posts.map((p) => (
            <li key={p.id} className="rounded-card border border-ink-100 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {p.is_question && (
                      <span className="mr-2 rounded bg-brand-100 px-1.5 py-0.5 text-[11px] text-brand-700">
                        คำถาม
                      </span>
                    )}
                    {p.title}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    โดย {p.profiles?.display_name ?? "ผู้ใช้"} ·{" "}
                    {formatDate(p.created_at)}
                    {p.products && ` · เกี่ยวกับ ${p.products.name}`}
                  </p>
                </div>
              </div>

              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-600">
                {p.body}
              </p>

              {!!p.tags?.length && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] text-ink-600"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              <Decision action={moderatePost} id={p.id} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Decision({
  action,
  id,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
}) {
  return (
    <div className="mt-4 flex gap-2">
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="decision" value="approved" />
        <button
          type="submit"
          className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700"
        >
          อนุมัติ
        </button>
      </form>
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="decision" value="rejected" />
        <button
          type="submit"
          className="rounded-lg border border-ink-200 px-4 py-2 text-xs font-semibold text-ink-600 hover:border-red-300 hover:text-red-600"
        >
          ไม่อนุมัติ
        </button>
      </form>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="mt-5 rounded-card border border-dashed border-ink-200 px-4 py-16 text-center text-sm text-ink-500">
      {text}
    </p>
  );
}
