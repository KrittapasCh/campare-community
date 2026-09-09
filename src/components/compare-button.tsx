"use client";

import { useRouter } from "next/navigation";

const KEY = "shopcam:compare";
const MAX = 4;

function readList(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export default function CompareButton({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const router = useRouter();

  function add() {
    const list = readList();
    const next = list.includes(slug) ? list : [...list, slug].slice(-MAX);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* โหมดไม่ให้เขียน storage — ข้ามได้ */
    }
    router.push(`/compare?${next.map((s) => `p=${s}`).join("&")}`);
  }

  return (
    <button
      type="button"
      onClick={add}
      className="rounded-lg border border-ink-200 px-5 py-3 text-sm font-semibold hover:border-brand-300 hover:text-brand-600"
      title={`เพิ่ม ${name} เข้าตารางเปรียบเทียบ`}
    >
      + เปรียบเทียบ
    </button>
  );
}
