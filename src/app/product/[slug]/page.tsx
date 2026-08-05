import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import ProductCard from "@/components/product-card";
import ProductThumb from "@/components/product-thumb";
import StarRating from "@/components/star-rating";
import WishlistButton from "@/components/wishlist-button";
import CompareButton from "@/components/compare-button";
import ReviewForm from "@/components/review/review-form";
import { formatDate, formatPrice } from "@/lib/format";
import {
  getCurrentUser,
  getListings,
  getProductBySlug,
  getRelatedProducts,
  getReviews,
} from "@/lib/queries";
import { specGroupsFor } from "@/lib/specs";
import {
  BEST_FOR_LABEL,
  CONDITION_LABEL,
  PRODUCT_TYPE_LABEL,
  STATUS_LABEL,
} from "@/lib/types";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "ไม่พบสินค้า" };
  return {
    title: product.name,
    description: product.summary ?? undefined,
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, reviews, listings, session] = await Promise.all([
    getRelatedProducts(product),
    getReviews(product.id),
    getListings(product.id),
    getCurrentUser(),
  ]);

  const price = product.market_price ?? product.msrp;
  const groups = specGroupsFor(product);
  const myReview = session
    ? (reviews.find((r) => r.author_id === session.user.id) ?? null)
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1 text-sm text-ink-500">
        <Link href="/" className="hover:text-brand-600">หน้าแรก</Link>
        <span>/</span>
        <Link
          href={`/category?type=${product.product_type}`}
          className="hover:text-brand-600"
        >
          {PRODUCT_TYPE_LABEL[product.product_type]}
        </Link>
        <span>/</span>
        <span className="text-ink-800">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        {/* รูป */}
        <div className="relative aspect-4/3 overflow-hidden rounded-card border border-ink-100 bg-ink-50">
          <ProductThumb
            src={product.thumbnail_url}
            alt={product.name}
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
          />
        </div>

        {/* ข้อมูลหลัก */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-ink-500">{product.companies?.name}</p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                {product.name}
              </h1>
              <p className="mt-1 text-sm text-ink-400">
                รหัสสินค้า #{product.product_no}
              </p>
            </div>
            <WishlistButton productId={product.id} size="lg" />
          </div>

          <div className="mt-3">
            <StarRating
              value={product.avg_rating}
              count={product.review_count}
              size="md"
            />
          </div>

          <div className="mt-5 rounded-card bg-brand-50 p-4">
            <p className="text-xs text-brand-800">ราคากลางมือสองในระบบ</p>
            <p className="mt-1 text-3xl font-bold text-brand-600">
              {formatPrice(price)}
            </p>
            {product.msrp && (
              <p className="mt-1 text-xs text-ink-500">
                ราคาป้ายเปิดตัว {formatPrice(product.msrp)} ·{" "}
                {STATUS_LABEL[product.status]}
              </p>
            )}
          </div>

          {product.summary && (
            <p className="mt-5 leading-relaxed text-ink-600">{product.summary}</p>
          )}

          {!!product.highlight?.length && (
            <ul className="mt-4 space-y-2">
              {product.highlight.map((h) => (
                <li key={h} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-400" />
                  {h}
                </li>
              ))}
            </ul>
          )}

          {!!product.best_for?.length && (
            <div className="mt-5">
              <p className="text-sm font-semibold">เหมาะกับการถ่าย</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.best_for.map((b) => (
                  <span
                    key={b}
                    className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-700"
                  >
                    {BEST_FOR_LABEL[b] ?? b}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="#listings"
              className="rounded-lg bg-brand-400 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-500"
            >
              ดูประกาศขาย ({listings.length})
            </Link>
            <CompareButton slug={product.slug} name={product.name} />
            <Link
              href={`/sell?product=${product.slug}`}
              className="rounded-lg border border-ink-200 px-5 py-3 text-sm font-semibold hover:border-brand-300 hover:text-brand-600"
            >
              ขายรุ่นนี้
            </Link>
          </div>
        </div>
      </div>

      {/* สเปก */}
      <section className="mt-12">
        <h2 className="text-xl font-bold">รายละเอียดและสเปก</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          {groups.map((g) => (
            <div
              key={g.title}
              className="overflow-hidden rounded-card border border-ink-100"
            >
              <p className="border-b border-ink-100 bg-ink-50 px-4 py-2 text-sm font-semibold">
                {g.title}
              </p>
              <dl className="divide-y divide-ink-100">
                {g.rows.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-2 gap-4 px-4 py-2.5 text-sm"
                  >
                    <dt className="text-ink-500">{row.label}</dt>
                    <dd className="font-medium">{row.value(product)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </section>

      {/* ประกาศขายมือสอง */}
      <section id="listings" className="mt-12 scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-bold">ประกาศขายมือสองของรุ่นนี้</h2>
          <Link
            href={`/sell?product=${product.slug}`}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            + ลงประกาศขายรุ่นนี้
          </Link>
        </div>
        {listings.length === 0 ? (
          <p className="mt-3 rounded-card border border-dashed border-ink-200 px-4 py-8 text-center text-sm text-ink-500">
            ยังไม่มีประกาศขายรุ่นนี้ในระบบ — เป็นคนแรกก็ได้
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-ink-100 rounded-card border border-ink-100">
            {listings.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center gap-4 px-4 py-3 text-sm"
              >
                <div className="min-w-48 flex-1">
                  <p className="font-medium">{l.title}</p>
                  <p className="text-xs text-ink-500">
                    โดย {l.profiles?.display_name ?? "ผู้ขาย"}
                    {l.province && ` · ${l.province}`}
                  </p>
                </div>
                <span className="rounded-full bg-ink-100 px-3 py-1 text-xs">
                  {CONDITION_LABEL[l.condition]}
                </span>
                <span className="text-xs text-ink-500">
                  ประกันถึง {formatDate(l.warranty_expire_date)}
                </span>
                <span className="font-bold text-brand-600">
                  {formatPrice(l.price)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* รีวิว */}
      <section className="mt-12">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold">
            รีวิว{" "}
            <span className="text-sm font-normal text-ink-500">
              ({product.review_count} รายการ)
            </span>
          </h2>
        </div>

        <div className="mt-4">
          <ReviewForm
            productId={product.id}
            slug={product.slug}
            signedIn={!!session}
            existing={myReview}
          />
        </div>

        {reviews.length === 0 ? (
          <p className="mt-4 rounded-card border border-dashed border-ink-200 px-4 py-8 text-center text-sm text-ink-500">
            ยังไม่มีรีวิว — เป็นคนแรกที่รีวิวรุ่นนี้ได้เลย
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-card border border-ink-100 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    {r.profiles?.display_name ?? "ผู้ใช้"}
                  </p>
                  <StarRating value={r.rating} />
                </div>
                {r.title && <p className="mt-2 font-medium">{r.title}</p>}
                {r.body && (
                  <p className="mt-1 text-sm leading-relaxed text-ink-600">
                    {r.body}
                  </p>
                )}
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {!!r.pros?.length && (
                    <div className="rounded-lg bg-green-50 p-3 text-xs">
                      <p className="font-semibold text-green-800">ข้อดี</p>
                      <ul className="mt-1 space-y-0.5 text-green-900">
                        {r.pros.map((x) => <li key={x}>+ {x}</li>)}
                      </ul>
                    </div>
                  )}
                  {!!r.cons?.length && (
                    <div className="rounded-lg bg-red-50 p-3 text-xs">
                      <p className="font-semibold text-red-800">ข้อเสีย</p>
                      <ul className="mt-1 space-y-0.5 text-red-900">
                        {r.cons.map((x) => <li key={x}>− {x}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
                <p className="mt-3 text-xs text-ink-400">
                  {formatDate(r.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* สินค้าอื่น */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold">สินค้าอื่นที่น่าสนใจ</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
