"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

/**
 * แถบเลือกหน้า — เก็บตัวกรองเดิมไว้ทั้งหมด เปลี่ยนแค่ page
 *
 * ใช้ <Link> ไม่ใช่ปุ่ม เพราะแต่ละหน้าควรมี URL ของตัวเอง:
 * แชร์ลิงก์ได้ กดปุ่ม back ของเบราว์เซอร์ได้ และ Next.js prefetch ให้ล่วงหน้า
 */
export default function Pagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const params = useSearchParams();

  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const next = new URLSearchParams(params.toString());
    if (p <= 1) next.delete("page");
    else next.set("page", String(p));
    const qs = next.toString();
    return qs ? `/category?${qs}` : "/category";
  };

  // แสดงหน้าแรก หน้าสุดท้าย และหน้ารอบ ๆ ตัวปัจจุบัน ที่เหลือย่อเป็น …
  const windowed = new Set<number>([1, totalPages, page]);
  for (let d = 1; d <= 2; d++) {
    if (page - d >= 1) windowed.add(page - d);
    if (page + d <= totalPages) windowed.add(page + d);
  }
  const pages = [...windowed].sort((a, b) => a - b);

  const base =
    "grid h-9 min-w-9 place-items-center rounded-lg border px-3 text-sm transition";

  return (
    <nav
      aria-label="เลือกหน้า"
      className="mt-8 flex flex-wrap items-center justify-center gap-1.5"
    >
      {page > 1 ? (
        <Link href={href(page - 1)} className={`${base} border-ink-200 hover:border-brand-300 hover:text-brand-600`}>
          ‹ ก่อนหน้า
        </Link>
      ) : (
        <span className={`${base} border-ink-100 text-ink-300`}>‹ ก่อนหน้า</span>
      )}

      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - pages[i - 1] > 1 && (
            <span className="px-1 text-sm text-ink-400">…</span>
          )}
          {p === page ? (
            <span
              aria-current="page"
              className={`${base} border-brand-400 bg-brand-400 font-semibold text-white`}
            >
              {p}
            </span>
          ) : (
            <Link
              href={href(p)}
              className={`${base} border-ink-200 hover:border-brand-300 hover:text-brand-600`}
            >
              {p}
            </Link>
          )}
        </span>
      ))}

      {page < totalPages ? (
        <Link href={href(page + 1)} className={`${base} border-ink-200 hover:border-brand-300 hover:text-brand-600`}>
          ถัดไป ›
        </Link>
      ) : (
        <span className={`${base} border-ink-100 text-ink-300`}>ถัดไป ›</span>
      )}
    </nav>
  );
}
