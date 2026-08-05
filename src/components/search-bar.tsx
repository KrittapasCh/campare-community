"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        router.push(q ? `/category?q=${encodeURIComponent(q)}` : "/category");
      }}
      className="relative"
    >
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="ค้นหารุ่นกล้อง เลนส์ หรือรหัสสินค้า"
        className="w-full rounded-full border border-ink-200 bg-ink-50 py-2 pl-4 pr-10 text-sm outline-none placeholder:text-ink-400 focus:border-brand-400 focus:bg-white"
      />
      <button
        type="submit"
        aria-label="ค้นหา"
        className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-ink-500 hover:bg-white hover:text-brand-500"
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-4" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
      </button>
    </form>
  );
}
