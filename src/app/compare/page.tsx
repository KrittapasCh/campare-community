import Link from "next/link";
import type { Metadata } from "next";

import ProductThumb from "@/components/product-thumb";
import StarRating from "@/components/star-rating";
import { formatPrice } from "@/lib/format";
import { getProducts, getProductsBySlugs } from "@/lib/queries";
import { specGroupsFor } from "@/lib/specs";
import type { Product } from "@/lib/types";

export const metadata: Metadata = { title: "เปรียบเทียบสินค้า" };

type SearchParams = Promise<{ p?: string | string[] }>;

export default async function ComparePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const slugs = (sp.p ? (Array.isArray(sp.p) ? sp.p : [sp.p]) : []).slice(0, 4);
  const products = await getProductsBySlugs(slugs);
  const suggestions = (await getProducts({ sort: "popular" }))
    .filter((p) => !slugs.includes(p.slug))
    .slice(0, 6);

  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">เปรียบเทียบสินค้า</h1>
        <p className="mt-2 text-ink-500">
          ยังไม่ได้เลือกสินค้า — เลือกได้ 2–4 รุ่นเพื่อดูสเปกเทียบกัน
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {suggestions.map((p) => (
            <Link
              key={p.id}
              href={`/compare?p=${p.slug}`}
              className="rounded-card border border-ink-100 p-3 text-sm hover:border-brand-300"
            >
              {p.name}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // แถวสเปกทั้งหมดที่ใช้กับสินค้าชุดนี้ (ยึดตัวแรกเป็นหลัก)
  const groups = specGroupsFor(products[0]);

  const removeHref = (slug: string) =>
    `/compare?${slugs.filter((s) => s !== slug).map((s) => `p=${s}`).join("&")}`;

  const addHref = (slug: string) =>
    `/compare?${[...slugs, slug].map((s) => `p=${s}`).join("&")}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">เปรียบเทียบแบบ side-by-side</h1>
        <p className="text-sm text-ink-500">
          เลือกแล้ว {products.length}/4 รุ่น · ช่องที่ต่างกันจะถูกไฮไลต์สีส้ม
        </p>
      </div>

      <div className="scroll-slim mt-6 overflow-x-auto">
        <table className="w-full min-w-3xl border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-44 bg-white p-3 text-left align-top text-sm text-ink-500">
                รายการ
              </th>
              {products.map((p) => (
                <th key={p.id} className="p-3 align-top">
                  <div className="rounded-card border border-ink-100 p-3 text-left">
                    <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-ink-50">
                      <ProductThumb src={p.thumbnail_url} alt={p.name} sizes="25vw" />
                    </div>
                    <Link
                      href={`/product/${p.slug}`}
                      className="mt-2 block text-sm font-semibold hover:text-brand-600"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-ink-400">#{p.product_no}</p>
                    <div className="mt-1">
                      <StarRating value={p.avg_rating} count={p.review_count} />
                    </div>
                    <p className="mt-2 font-bold text-brand-600">
                      {formatPrice(p.market_price ?? p.msrp)}
                    </p>
                    <Link
                      href={removeHref(p.slug)}
                      className="mt-2 inline-block text-xs text-ink-400 hover:text-red-500"
                    >
                      เอาออก
                    </Link>
                  </div>
                </th>
              ))}
              {products.length < 4 && (
                <th className="p-3 align-top">
                  <div className="rounded-card border border-dashed border-ink-200 p-3 text-left">
                    <p className="text-sm font-medium text-ink-500">
                      เพิ่มอีกรุ่น
                    </p>
                    <ul className="mt-2 space-y-1">
                      {suggestions.slice(0, 5).map((s) => (
                        <li key={s.id}>
                          <Link
                            href={addHref(s.slug)}
                            className="text-xs text-ink-600 hover:text-brand-600"
                          >
                            + {s.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {groups.map((g) => (
              <FragmentGroup
                key={g.title}
                title={g.title}
                rows={g.rows}
                products={products}
                extraCol={products.length < 4}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FragmentGroup({
  title,
  rows,
  products,
  extraCol,
}: {
  title: string;
  rows: { label: string; value: (p: Product) => string }[];
  products: Product[];
  extraCol: boolean;
}) {
  const span = products.length + 1 + (extraCol ? 1 : 0);

  return (
    <>
      <tr>
        <td
          colSpan={span}
          className="border-y border-ink-100 bg-ink-50 px-3 py-2 text-sm font-semibold"
        >
          {title}
        </td>
      </tr>
      {rows.map((row) => {
        const values = products.map((p) => row.value(p));
        const differs = new Set(values).size > 1;
        return (
          <tr key={row.label} className="text-sm">
            <td className="sticky left-0 z-10 border-b border-ink-100 bg-white px-3 py-2.5 text-ink-500">
              {row.label}
            </td>
            {values.map((v, i) => (
              <td
                key={products[i].id}
                className={
                  "border-b border-ink-100 px-3 py-2.5 " +
                  (differs ? "bg-brand-50 font-medium text-brand-800" : "")
                }
              >
                {v}
              </td>
            ))}
            {extraCol && <td className="border-b border-ink-100" />}
          </tr>
        );
      })}
    </>
  );
}
