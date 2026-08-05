import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import ProfileForm from "@/components/profile/profile-form";
import StarRating from "@/components/star-rating";
import { signOut } from "@/app/auth/actions";
import { closeListing, reopenListing } from "@/app/sell/actions";
import { CONDITION_LABEL, type ItemCondition } from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/format";
import { getCurrentUser } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "โปรไฟล์ของฉัน" };

const TABS = [
  ["about", "ข้อมูลส่วนตัว"],
  ["selling", "ประกาศของฉัน"],
  ["purchase", "ประวัติการซื้อ"],
  ["review", "รีวิวของฉัน"],
  ["favourite", "รายการโปรด"],
] as const;

type Tab = (typeof TABS)[number][0];
type SearchParams = Promise<{ tab?: string }>;

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const tab = (TABS.find(([t]) => t === sp.tab)?.[0] ?? "about") as Tab;

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">โปรไฟล์ของฉัน</h1>
        <p className="mt-3 text-ink-500">
          หน้านี้ต้องเชื่อม Supabase ก่อน — ตั้งค่า{" "}
          <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-sm">
            .env.local
          </code>{" "}
          แล้วรีสตาร์ท dev server
        </p>
      </div>
    );
  }

  const session = await getCurrentUser();
  if (!session) redirect("/login?next=/profile");

  const profile = session.profile as Profile;
  const supabase = await createClient();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-col items-center rounded-card border border-ink-100 p-5 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
              {(profile?.display_name ?? "U").charAt(0).toUpperCase()}
            </span>
            <p className="mt-3 font-semibold">{profile?.display_name}</p>
            <p className="text-xs text-ink-500">{profile?.email}</p>
            {profile?.role === "admin" && (
              <span className="mt-2 rounded-full bg-ink-800 px-2.5 py-0.5 text-[11px] text-white">
                ผู้ดูแลระบบ
              </span>
            )}
          </div>

          <nav className="mt-4 space-y-1">
            {TABS.map(([value, label]) => (
              <Link
                key={value}
                href={`/profile?tab=${value}`}
                className={
                  "block rounded-lg px-4 py-2.5 text-sm font-medium transition " +
                  (tab === value
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-600 hover:bg-ink-50")
                }
              >
                {label}
              </Link>
            ))}
          </nav>

          <form action={signOut} className="mt-4">
            <button
              type="submit"
              className="w-full rounded-lg border border-ink-200 py-2.5 text-sm font-medium text-ink-600 hover:border-red-300 hover:text-red-600"
            >
              ออกจากระบบ
            </button>
          </form>
        </aside>

        {/* content */}
        <section>
          {tab === "about" && (
            <>
              <h1 className="text-xl font-bold">ข้อมูลส่วนตัว</h1>
              <div className="mt-4 max-w-lg">
                <ProfileForm profile={profile} />
              </div>
            </>
          )}

          {tab === "selling" && <SellingTab supabase={supabase} userId={profile.id} />}
          {tab === "purchase" && <PurchaseTab supabase={supabase} />}
          {tab === "review" && <ReviewTab supabase={supabase} userId={profile.id} />}
          {tab === "favourite" && <FavouriteTab supabase={supabase} userId={profile.id} />}
        </section>
      </div>
    </div>
  );
}

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

async function SellingTab({
  supabase,
  userId,
}: {
  supabase: SupabaseServer;
  userId: string;
}) {
  const { data } = await supabase
    .from("listings")
    .select(
      "id, title, price, quantity, condition, status, province, created_at, product_id, products ( name, slug )"
    )
    .eq("seller_id", userId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  const listings = (data ?? []) as unknown as {
    id: string;
    title: string;
    price: number;
    quantity: number;
    condition: ItemCondition;
    status: string;
    province: string | null;
    created_at: string;
    product_id: string;
    products: { name: string; slug: string } | null;
  }[];

  const STATUS_TH: Record<string, string> = {
    active: "กำลังขาย",
    sold: "ขายแล้ว",
    reserved: "จองแล้ว",
    hidden: "ซ่อนอยู่",
    draft: "ฉบับร่าง",
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">ประกาศของฉัน</h1>
        <Link
          href="/sell"
          className="rounded-lg bg-brand-400 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
        >
          + ลงประกาศใหม่
        </Link>
      </div>

      {listings.length === 0 ? (
        <Empty
          text="ยังไม่มีประกาศขาย — ลงขายของที่ไม่ได้ใช้แล้วก็ได้"
          href="/sell"
          cta="ลงประกาศแรก"
        />
      ) : (
        <ul className="mt-4 space-y-3">
          {listings.map((l) => (
            <li key={l.id} className="rounded-card border border-ink-100 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{l.title}</p>
                  <Link
                    href={`/product/${l.products?.slug}`}
                    className="text-xs text-ink-500 hover:text-brand-600"
                  >
                    {l.products?.name}
                  </Link>
                  <p className="mt-1 text-xs text-ink-400">
                    {CONDITION_LABEL[l.condition]}
                    {l.province && ` · ${l.province}`} · ลงเมื่อ{" "}
                    {formatDate(l.created_at)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-brand-600">
                    {formatPrice(l.price)}
                  </p>
                  <span
                    className={
                      "mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] " +
                      (l.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-ink-100 text-ink-600")
                    }
                  >
                    {STATUS_TH[l.status] ?? l.status}
                  </span>
                </div>
              </div>

              <form
                action={l.status === "active" ? closeListing : reopenListing}
                className="mt-3"
              >
                <input type="hidden" name="listing_id" value={l.id} />
                <input type="hidden" name="product_id" value={l.product_id} />
                <button
                  type="submit"
                  className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:border-brand-300 hover:text-brand-600"
                >
                  {l.status === "active" ? "ทำเครื่องหมายว่าขายแล้ว" : "เปิดขายอีกครั้ง"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

async function PurchaseTab({ supabase }: { supabase: SupabaseServer }) {
  const { data } = await supabase
    .from("orders")
    .select(
      "id, order_no, status, total, ordered_at, order_items ( id, product_name, unit_price, quantity )"
    )
    .order("ordered_at", { ascending: false })
    .limit(20);

  const orders = (data ?? []) as unknown as {
    id: string;
    order_no: string;
    status: string;
    total: number;
    ordered_at: string;
    order_items: { id: string; product_name: string; unit_price: number; quantity: number }[];
  }[];

  return (
    <>
      <h1 className="text-xl font-bold">ประวัติการซื้อ</h1>
      {orders.length === 0 ? (
        <Empty text="ยังไม่มีคำสั่งซื้อ" href="/category" cta="ไปเลือกสินค้า" />
      ) : (
        <ul className="mt-4 space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="rounded-card border border-ink-100">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold">คำสั่งซื้อ #{o.order_no}</p>
                  <p className="text-xs text-ink-500">{formatDate(o.ordered_at)}</p>
                </div>
                <span className="rounded-full bg-ink-100 px-3 py-1 text-xs">
                  {o.status}
                </span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink-500">
                    <th className="px-4 py-2 font-medium">สินค้า</th>
                    <th className="px-4 py-2 font-medium">ราคาต่อชิ้น</th>
                    <th className="px-4 py-2 font-medium">จำนวน</th>
                    <th className="px-4 py-2 text-right font-medium">รวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {o.order_items.map((it) => (
                    <tr key={it.id}>
                      <td className="px-4 py-2">{it.product_name}</td>
                      <td className="px-4 py-2">{formatPrice(it.unit_price)}</td>
                      <td className="px-4 py-2">{it.quantity}</td>
                      <td className="px-4 py-2 text-right">
                        {formatPrice(it.unit_price * it.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t border-ink-100 px-4 py-3 text-right text-sm font-bold">
                รวมทั้งสิ้น {formatPrice(o.total)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

async function ReviewTab({
  supabase,
  userId,
}: {
  supabase: SupabaseServer;
  userId: string;
}) {
  const { data } = await supabase
    .from("reviews")
    .select("id, rating, title, body, created_at, products ( name, slug )")
    .eq("author_id", userId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  const reviews = (data ?? []) as unknown as {
    id: string;
    rating: number;
    title: string | null;
    body: string | null;
    created_at: string;
    products: { name: string; slug: string } | null;
  }[];

  return (
    <>
      <h1 className="text-xl font-bold">รีวิวของฉัน</h1>
      {reviews.length === 0 ? (
        <Empty text="ยังไม่ได้เขียนรีวิว" href="/category" cta="หาสินค้าไปรีวิว" />
      ) : (
        <ul className="mt-4 space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-card border border-ink-100 p-4">
              <div className="flex items-center justify-between">
                <Link
                  href={`/product/${r.products?.slug}`}
                  className="font-semibold hover:text-brand-600"
                >
                  {r.products?.name}
                </Link>
                <StarRating value={r.rating} />
              </div>
              {r.title && <p className="mt-2 font-medium">{r.title}</p>}
              {r.body && (
                <p className="mt-1 text-sm leading-relaxed text-ink-600">{r.body}</p>
              )}
              <p className="mt-2 text-xs text-ink-400">{formatDate(r.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

async function FavouriteTab({
  supabase,
  userId,
}: {
  supabase: SupabaseServer;
  userId: string;
}) {
  const { data } = await supabase
    .from("wishlist_items")
    .select(
      "id, added_at, target_price, wishlists!inner ( user_id ), products ( id, slug, name, product_no, thumbnail_url, market_price, msrp, avg_rating, review_count )"
    )
    .eq("wishlists.user_id", userId)
    .order("added_at", { ascending: false });

  const items = (data ?? []) as unknown as {
    id: string;
    added_at: string;
    products: {
      id: string;
      slug: string;
      name: string;
      product_no: string;
      thumbnail_url: string | null;
      market_price: number | null;
      msrp: number | null;
      avg_rating: number;
      review_count: number;
    } | null;
  }[];

  return (
    <>
      <h1 className="text-xl font-bold">รายการโปรด</h1>
      {items.length === 0 ? (
        <Empty
          text="ยังไม่มีรายการโปรด — กดรูปหัวใจที่สินค้าเพื่อบันทึกไว้"
          href="/category"
          cta="ไปเลือกสินค้า"
        />
      ) : (
        <ul className="mt-4 divide-y divide-ink-100 rounded-card border border-ink-100">
          {items.map((it) =>
            it.products ? (
              <li key={it.id} className="flex items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${it.products.slug}`}
                    className="font-medium hover:text-brand-600"
                  >
                    {it.products.name}
                  </Link>
                  <p className="text-xs text-ink-500">
                    #{it.products.product_no} · บันทึกเมื่อ {formatDate(it.added_at)}
                  </p>
                </div>
                <StarRating
                  value={it.products.avg_rating}
                  count={it.products.review_count}
                />
                <span className="font-bold text-brand-600">
                  {formatPrice(it.products.market_price ?? it.products.msrp)}
                </span>
              </li>
            ) : null
          )}
        </ul>
      )}
    </>
  );
}

function Empty({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="mt-4 rounded-card border border-dashed border-ink-200 py-14 text-center">
      <p className="text-sm text-ink-500">{text}</p>
      <Link
        href={href}
        className="mt-4 inline-block rounded-lg bg-brand-400 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-500"
      >
        {cta}
      </Link>
    </div>
  );
}
