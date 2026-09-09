"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PRODUCT_TYPE_LABEL, type ProductOption, type ProductType } from "@/lib/types";

/**
 * ช่องเลือกสินค้าแบบพิมพ์ค้นหา
 *
 * แทนที่ <select> เพราะแคตตาล็อกมีหลักพันรุ่น — เลื่อนหาใน dropdown ยาว ๆ
 * ใช้ไม่ได้จริง และการส่งตัวเลือกทั้งหมดมาให้เบราว์เซอร์ก็เปลืองเปล่า ๆ
 *
 * ค่าที่ฟอร์มส่งจริงอยู่ใน <input type="hidden"> เพื่อให้ server action
 * อ่านผ่าน formData ได้เหมือนช่องปกติ
 */
export default function ProductPicker({
  name = "product_id",
  type,
  required = false,
  label,
  hint,
  defaultProduct = null,
  onSelect,
}: {
  name?: string;
  type?: ProductType;
  required?: boolean;
  label: string;
  hint?: string;
  defaultProduct?: ProductOption | null;
  onSelect?: (p: ProductOption | null) => void;
}) {
  const inputId = useId();
  const boxRef = useRef<HTMLDivElement>(null);

  const [selected, setSelected] = useState<ProductOption | null>(defaultProduct);
  const [term, setTerm] = useState("");
  const [items, setItems] = useState<ProductOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // ปิด dropdown เมื่อคลิกนอกกล่อง
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // หน่วงก่อนยิงค้นหา ไม่งั้นพิมพ์ 10 ตัวอักษรจะยิง 10 ครั้ง
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (term) params.set("q", term);
        if (type) params.set("type", type);
        const res = await fetch(`/api/products/search?${params}`);
        const json = await res.json();
        setItems(json.items ?? []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [term, type, open]);

  function choose(p: ProductOption | null) {
    setSelected(p);
    setOpen(false);
    setTerm("");
    onSelect?.(p);
  }

  return (
    <div ref={boxRef} className="relative">
      <input type="hidden" name={name} value={selected?.id ?? ""} />

      <label htmlFor={inputId} className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {selected ? (
        <div className="mt-1 flex items-center gap-2 rounded-lg border border-brand-300 bg-brand-50 px-3 py-2.5">
          <span className="min-w-0 flex-1 truncate text-sm">
            <span className="font-medium">{selected.name}</span>
            <span className="ml-2 text-xs text-ink-500">#{selected.product_no}</span>
          </span>
          <button
            type="button"
            onClick={() => choose(null)}
            className="shrink-0 text-xs text-ink-500 hover:text-red-600"
          >
            เปลี่ยน
          </button>
        </div>
      ) : (
        <input
          id={inputId}
          type="text"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
          className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
          placeholder="พิมพ์ชื่อรุ่นเพื่อค้นหา เช่น a7c, r6, x-t5"
        />
      )}

      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}

      {open && !selected && (
        <ul className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-ink-200 bg-white shadow-lg">
          {loading && (
            <li className="px-3 py-2.5 text-sm text-ink-400">กำลังค้นหา…</li>
          )}
          {!loading && items.length === 0 && (
            <li className="px-3 py-2.5 text-sm text-ink-400">
              {term ? "ไม่พบรุ่นที่ตรงกับคำค้น" : "พิมพ์เพื่อค้นหา"}
            </li>
          )}
          {!loading &&
            items.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => choose(p)}
                  className="block w-full px-3 py-2.5 text-left text-sm hover:bg-brand-50"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="mt-0.5 block text-xs text-ink-500">
                    {PRODUCT_TYPE_LABEL[p.product_type]} · #{p.product_no}
                  </span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
