import Link from "next/link";
import ProductCard from "@/components/product-card";
import { getBrands, getProducts } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { PRODUCT_TYPE_LABEL, type ProductType } from "@/lib/types";

const CATEGORIES: { type: ProductType; icon: string }[] = [
  { type: "camera", icon: "📷" },
  { type: "lens", icon: "🔎" },
  { type: "tripod", icon: "🦵" },
  { type: "filter", icon: "🟠" },
  { type: "strap", icon: "🎗️" },
  { type: "grip", icon: "🔋" },
];

export default async function HomePage() {
  const [recommended, newest, brands] = await Promise.all([
    getProducts({ sort: "popular" }),
    getProducts({ sort: "newest" }),
    getBrands(),
  ]);

  return (
    <>
      {!isSupabaseConfigured && (
        <div className="bg-brand-50 px-4 py-2 text-center text-xs text-brand-800">
          กำลังแสดงข้อมูลตัวอย่าง — ตั้งค่า <code className="font-mono">.env.local</code> เพื่อเชื่อม Supabase จริง
        </div>
      )}

      {/* HERO */}
      <section className="border-b border-ink-100 bg-linear-to-b from-brand-50 to-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-200">
              เปรียบเทียบได้ 2–4 รุ่นพร้อมกัน
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
              เลือกกล้องให้ตรงกับ
              <span className="text-brand-500">สิ่งที่คุณอยากถ่าย</span>
            </h1>
            <p className="mt-4 max-w-lg leading-relaxed text-ink-600">
              ดูสเปกแบบ side-by-side ที่ไฮไลต์ความต่างให้อัตโนมัติ
              เทียบราคามือสองจากประกาศจริง อ่านรีวิวจากคนใช้จริง
              แล้วค่อยตัดสินใจ
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/category"
                className="rounded-lg bg-brand-400 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-500"
              >
                เริ่มเลือกสินค้า
              </Link>
              <Link
                href="/compare"
                className="rounded-lg border border-ink-200 px-5 py-3 text-sm font-semibold hover:border-brand-300 hover:text-brand-600"
              >
                ไปหน้าเปรียบเทียบ
              </Link>
            </div>

            <dl className="mt-8 flex gap-8 text-sm">
              <div>
                <dt className="text-ink-500">รุ่นในระบบ</dt>
                <dd className="text-xl font-bold">{recommended.length}</dd>
              </div>
              <div>
                <dt className="text-ink-500">แบรนด์</dt>
                <dd className="text-xl font-bold">{brands.length}</dd>
              </div>
              <div>
                <dt className="text-ink-500">รีวิวรวม</dt>
                <dd className="text-xl font-bold">
                  {recommended.reduce((s, p) => s + p.review_count, 0)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {recommended.slice(0, 3).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* จุดขาย 3 ข้อ (แถบใต้ hero ตาม wireframe) */}
      <section className="border-b border-ink-100">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-3">
          {[
            ["เทียบสเปกอัตโนมัติ", "ระบบไฮไลต์ช่องที่ต่างกันให้เอง ไม่ต้องไล่อ่านเอง"],
            ["ราคากลางมือสอง", "คำนวณจากประกาศขายจริงในระบบ ดูแนวโน้มได้"],
            ["แจ้งเตือน Wishlist", "มีของเข้าตรงรุ่นที่กดใจไว้ ระบบเตือนทันที"],
          ].map(([title, desc]) => (
            <div key={title} className="flex items-start gap-3">
              <span className="mt-1 size-2 shrink-0 rounded-full bg-brand-400" />
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs leading-relaxed text-ink-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ประเภทสินค้า */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="text-xl font-bold">ประเภทสินค้า</h2>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {CATEGORIES.map(({ type, icon }) => (
            <Link
              key={type}
              href={`/category?type=${type}`}
              className="flex flex-col items-center gap-2 rounded-card border border-ink-100 p-4 text-center transition hover:border-brand-300 hover:bg-brand-50"
            >
              <span className="text-2xl">{icon}</span>
              <span className="text-xs font-medium">
                {PRODUCT_TYPE_LABEL[type]}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* สินค้าแนะนำ */}
      <section className="mx-auto max-w-7xl px-4 pb-10">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold">สินค้าแนะนำ</h2>
          <Link
            href="/category"
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            ดูทั้งหมด →
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {recommended.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* มาใหม่ */}
      <section className="mx-auto max-w-7xl px-4 pb-4">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold">เพิ่งเปิดตัว</h2>
          <Link
            href="/category?sort=newest"
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            ดูทั้งหมด →
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {newest.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* แบรนด์ */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="text-xl font-bold">แบรนด์</h2>
        <div className="scroll-slim mt-4 flex gap-3 overflow-x-auto pb-2">
          {brands.map((b) => (
            <Link
              key={b.id}
              href={`/category?brand=${b.slug}`}
              className="shrink-0 rounded-full border border-ink-200 px-5 py-2 text-sm font-medium hover:border-brand-400 hover:text-brand-600"
            >
              {b.name}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
