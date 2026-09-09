"use client";

import { useActionState, useState } from "react";
import { createListing, type FormState } from "@/app/sell/actions";
import SubmitButton from "@/components/auth/submit-button";
import ProductPicker from "@/components/product-picker";
import { formatPrice } from "@/lib/format";
import {
  CONDITION_LABEL,
  type ItemCondition,
  type ProductOption,
} from "@/lib/types";

const initial: FormState = {};

const field =
  "mt-1 w-full rounded-lg border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400";

export default function ListingForm({
  defaultProduct = null,
}: {
  defaultProduct?: ProductOption | null;
}) {
  const [state, formAction] = useActionState(createListing, initial);

  const [selected, setSelected] = useState<ProductOption | null>(defaultProduct);
  const [price, setPrice] = useState("");

  // เทียบราคาที่ตั้งกับราคากลาง เพื่อเตือนว่าตั้งสูง/ต่ำผิดปกติ
  const reference = selected?.market_price ?? selected?.msrp ?? null;
  const priceNum = Number(price);
  const hint =
    reference && Number.isFinite(priceNum) && priceNum > 0
      ? priceNum > reference * 1.3
        ? { tone: "warn", text: `สูงกว่าราคาอ้างอิง (${formatPrice(reference)}) มาก อาจขายยาก` }
        : priceNum < reference * 0.5
          ? { tone: "warn", text: `ต่ำกว่าราคาอ้างอิง (${formatPrice(reference)}) มาก ตรวจสอบอีกครั้ง` }
          : { tone: "ok", text: `อยู่ในช่วงที่สมเหตุสมผล (อ้างอิง ${formatPrice(reference)})` }
      : null;

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <ProductPicker
          label="รุ่นสินค้า"
          required
          defaultProduct={defaultProduct}
          onSelect={setSelected}
        />
        {selected && (
          <p className="mt-1 text-xs text-ink-500">
            ราคาป้ายเปิดตัว {formatPrice(selected.msrp)}
            {selected.market_price
              ? ` · ราคากลางตอนนี้ ${formatPrice(selected.market_price)}`
              : " · ยังไม่มีราคากลาง (ยังไม่มีใครลงประกาศขายรุ่นนี้)"}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="title" className="text-sm font-medium">
          หัวข้อประกาศ <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={120}
          className={field}
          placeholder="เช่น ขาย Sony A7C II ศูนย์ไทย ประกันเหลือ สภาพนางฟ้า"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="price" className="text-sm font-medium">
            ราคา (บาท) <span className="text-red-500">*</span>
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={field}
            placeholder="45000"
          />
          {hint && (
            <p
              className={
                "mt-1 text-xs " +
                (hint.tone === "warn" ? "text-amber-600" : "text-green-600")
              }
            >
              {hint.text}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="quantity" className="text-sm font-medium">
            จำนวน
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            defaultValue={1}
            className={field}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="condition" className="text-sm font-medium">
            สภาพสินค้า
          </label>
          <select id="condition" name="condition" defaultValue="good" className={field}>
            {(Object.keys(CONDITION_LABEL) as ItemCondition[]).map((c) => (
              <option key={c} value={c}>
                {CONDITION_LABEL[c]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="warranty_expire_date" className="text-sm font-medium">
            ประกันหมดอายุ
          </label>
          <input
            id="warranty_expire_date"
            name="warranty_expire_date"
            type="date"
            className={field}
          />
          <p className="mt-1 text-xs text-ink-400">เว้นว่างได้ถ้าหมดประกันแล้ว</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="shutter_count" className="text-sm font-medium">
            ชัตเตอร์ (ครั้ง)
          </label>
          <input
            id="shutter_count"
            name="shutter_count"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            className={field}
            placeholder="เฉพาะกล้อง"
          />
        </div>

        <div>
          <label htmlFor="province" className="text-sm font-medium">
            จังหวัด
          </label>
          <input
            id="province"
            name="province"
            className={field}
            placeholder="เช่น กรุงเทพมหานคร"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="text-sm font-medium">
          รายละเอียด
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          className={field}
          placeholder="อุปกรณ์ที่ให้มา ตำหนิ เหตุผลที่ขาย นัดรับได้ที่ไหน"
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="กำลังลงประกาศ…">ลงประกาศขาย</SubmitButton>
    </form>
  );
}
