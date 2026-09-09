"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { PRODUCT_TYPE_LABEL, type Company, type ProductType } from "@/lib/types";
import { formatPrice } from "@/lib/format";

const TYPES = Object.keys(PRODUCT_TYPE_LABEL) as ProductType[];
const PRICE_FLOOR = 0;
const PRICE_CEIL = 150000;

export default function CategoryFilters({ brands }: { brands: Company[] }) {
  const router = useRouter();
  const params = useSearchParams();

  const [maxPrice, setMaxPrice] = useState(
    Number(params.get("max") ?? PRICE_CEIL)
  );

  const push = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      // เปลี่ยนตัวกรองแล้วต้องกลับไปหน้า 1 เสมอ
      // ไม่งั้นค้างอยู่หน้า 120 ของผลลัพธ์เดิมที่อาจมีแค่ 3 หน้า
      next.delete("page");
      router.push(`/category?${next.toString()}`);
    },
    [params, router]
  );

  const activeType = params.get("type");
  const activeBrands = params.getAll("brand");
  const minRating = params.get("rating");
  const activeStatus = params.get("status");
  const activeYear = params.get("year") ?? "";

  return (
    <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">ตัวกรอง</h2>
        <button
          type="button"
          onClick={() => router.push("/category")}
          className="text-xs text-ink-500 underline-offset-2 hover:text-brand-600 hover:underline"
        >
          ล้างทั้งหมด
        </button>
      </div>

      {/* ราคา */}
      <section className="rounded-card border border-ink-100 p-4">
        <p className="text-sm font-semibold">ราคา</p>
        <input
          type="range"
          min={PRICE_FLOOR}
          max={PRICE_CEIL}
          step={1000}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          onMouseUp={() =>
            push((p) => {
              if (maxPrice >= PRICE_CEIL) p.delete("max");
              else p.set("max", String(maxPrice));
            })
          }
          onTouchEnd={() =>
            push((p) => {
              if (maxPrice >= PRICE_CEIL) p.delete("max");
              else p.set("max", String(maxPrice));
            })
          }
          className="mt-3 w-full accent-brand-400"
        />
        <div className="mt-1 flex justify-between text-xs text-ink-500">
          <span>{formatPrice(PRICE_FLOOR)}</span>
          <span className="font-medium text-brand-600">
            ไม่เกิน {formatPrice(maxPrice)}
          </span>
        </div>
      </section>

      {/* สถานะการผลิต */}
      <section className="rounded-card border border-ink-100 p-4">
        <p className="text-sm font-semibold">สถานะการผลิต</p>
        <div className="mt-3 space-y-1">
          {[
            ["", "ทั้งหมด"],
            ["in_production", "ยังผลิตอยู่"],
            ["discontinued", "เลิกผลิตแล้ว"],
          ].map(([value, label]) => (
            <label
              key={value || "all"}
              className="flex cursor-pointer items-center gap-2 text-sm text-ink-600"
            >
              <input
                type="radio"
                name="status"
                checked={(activeStatus ?? "") === value}
                onChange={() =>
                  push((p) => (value ? p.set("status", value) : p.delete("status")))
                }
                className="accent-brand-400"
              />
              {label}
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-400">
          คลังข้อมูลครอบคลุมกล้องตั้งแต่ปี 1994 จึงมีรุ่นที่เลิกผลิตแล้วเป็นส่วนใหญ่
        </p>
      </section>

      {/* ปีที่เปิดตัว */}
      <section className="rounded-card border border-ink-100 p-4">
        <p className="text-sm font-semibold">ปีที่เปิดตัว</p>
        <select
          value={activeYear}
          onChange={(e) =>
            push((p) =>
              e.target.value ? p.set("year", e.target.value) : p.delete("year")
            )
          }
          className="mt-3 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
        >
          <option value="">ทุกปี</option>
          <option value="2020">ปี 2020 ขึ้นไป</option>
          <option value="2015">ปี 2015 ขึ้นไป</option>
          <option value="2010">ปี 2010 ขึ้นไป</option>
          <option value="2000">ปี 2000 ขึ้นไป</option>
        </select>
      </section>

      {/* ประเภท */}
      <section className="rounded-card border border-ink-100 p-4">
        <p className="text-sm font-semibold">ประเภทสินค้า</p>
        <div className="mt-3 space-y-1">
          {TYPES.map((t) => (
            <label
              key={t}
              className="flex cursor-pointer items-center gap-2 text-sm text-ink-600"
            >
              <input
                type="radio"
                name="type"
                checked={activeType === t}
                onChange={() => push((p) => p.set("type", t))}
                className="accent-brand-400"
              />
              {PRODUCT_TYPE_LABEL[t]}
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-600">
            <input
              type="radio"
              name="type"
              checked={!activeType}
              onChange={() => push((p) => p.delete("type"))}
              className="accent-brand-400"
            />
            ทั้งหมด
          </label>
        </div>
      </section>

      {/* แบรนด์ */}
      <section className="rounded-card border border-ink-100 p-4">
        <p className="text-sm font-semibold">แบรนด์</p>
        <div className="mt-3 max-h-56 space-y-1 overflow-y-auto pr-1">
          {brands.map((b) => (
            <label
              key={b.id}
              className="flex cursor-pointer items-center gap-2 text-sm text-ink-600"
            >
              <input
                type="checkbox"
                checked={activeBrands.includes(b.slug)}
                onChange={(e) =>
                  push((p) => {
                    const current = p.getAll("brand");
                    p.delete("brand");
                    const next = e.target.checked
                      ? [...current, b.slug]
                      : current.filter((x) => x !== b.slug);
                    next.forEach((s) => p.append("brand", s));
                  })
                }
                className="accent-brand-400"
              />
              {b.name}
            </label>
          ))}
        </div>
      </section>

      {/* คะแนน */}
      <section className="rounded-card border border-ink-100 p-4">
        <p className="text-sm font-semibold">คะแนนรีวิว</p>
        <div className="mt-3 space-y-1">
          {[4.5, 4, 3.5].map((r) => (
            <label
              key={r}
              className="flex cursor-pointer items-center gap-2 text-sm text-ink-600"
            >
              <input
                type="radio"
                name="rating"
                checked={minRating === String(r)}
                onChange={() => push((p) => p.set("rating", String(r)))}
                className="accent-brand-400"
              />
              <span className="text-brand-400">★</span> {r} ขึ้นไป
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-600">
            <input
              type="radio"
              name="rating"
              checked={!minRating}
              onChange={() => push((p) => p.delete("rating"))}
              className="accent-brand-400"
            />
            ทุกคะแนน
          </label>
        </div>
      </section>
    </aside>
  );
}
