"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  ["popular", "ยอดนิยม"],
  ["newest", "มาใหม่ล่าสุด"],
  ["price_asc", "ราคาต่ำ → สูง"],
  ["price_desc", "ราคาสูง → ต่ำ"],
  ["rating", "คะแนนรีวิวสูงสุด"],
] as const;

export default function SortSelect() {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <label className="flex items-center gap-2 text-sm text-ink-500">
      เรียงตาม
      <select
        value={params.get("sort") ?? "popular"}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          next.set("sort", e.target.value);
          router.push(`/category?${next.toString()}`);
        }}
        className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none focus:border-brand-400"
      >
        {OPTIONS.map(([v, label]) => (
          <option key={v} value={v}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
