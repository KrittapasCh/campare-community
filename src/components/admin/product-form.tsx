"use client";

import { useActionState, useState } from "react";
import { saveProduct, type ProductFormState } from "@/app/admin/products/actions";
import SubmitButton from "@/components/auth/submit-button";
import {
  PRODUCT_TYPE_LABEL,
  type CameraSpecs,
  type Company,
  type LensSpecs,
  type Product,
  type ProductType,
} from "@/lib/types";

const initial: ProductFormState = {};

const field =
  "mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
  step,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  placeholder?: string;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className={field}
      />
    </label>
  );
}

function Check({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean | null;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink-600">
      <input
        type="checkbox"
        name={name}
        defaultChecked={!!defaultChecked}
        className="accent-brand-400"
      />
      {label}
    </label>
  );
}

export default function ProductForm({
  companies,
  product,
}: {
  companies: Company[];
  product?: (Product & { camera_specs?: CameraSpecs | null; lens_specs?: LensSpecs | null }) | null;
}) {
  const [state, formAction] = useActionState(saveProduct, initial);
  const [type, setType] = useState<ProductType>(
    product?.product_type ?? "camera"
  );

  const cam = product?.camera_specs;
  const lens = product?.lens_specs;

  return (
    <form action={formAction} className="space-y-8">
      {product && <input type="hidden" name="id" value={product.id} />}

      <section className="space-y-4">
        <h2 className="font-bold">ข้อมูลพื้นฐาน</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ชื่อสินค้า *" name="name" defaultValue={product?.name} placeholder="Sony A7C II" />
          <Field label="รหัสสินค้า *" name="product_no" defaultValue={product?.product_no} placeholder="SNY-A7C2" />
        </div>

        <Field
          label="slug (ใช้เป็น URL) *"
          name="slug"
          defaultValue={product?.slug}
          placeholder="sony-a7c-ii"
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium">ประเภท *</span>
            <select
              name="product_type"
              value={type}
              onChange={(e) => setType(e.target.value as ProductType)}
              className={field}
            >
              {(Object.keys(PRODUCT_TYPE_LABEL) as ProductType[]).map((t) => (
                <option key={t} value={t}>
                  {PRODUCT_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">แบรนด์ *</span>
            <select
              name="company_id"
              defaultValue={product?.company_id ?? ""}
              className={field}
            >
              <option value="">— เลือก —</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">สถานะการผลิต</span>
            <select
              name="status"
              defaultValue={product?.status ?? "in_production"}
              className={field}
            >
              <option value="in_production">ยังผลิตอยู่</option>
              <option value="discontinued">เลิกผลิตแล้ว</option>
              <option value="announced">เพิ่งเปิดตัว</option>
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="วันเปิดตัว"
            name="announced_date"
            type="date"
            defaultValue={product?.announced_date ?? ""}
          />
          <Field
            label="ราคาป้าย (บาท)"
            name="msrp"
            type="number"
            step="1"
            defaultValue={product?.msrp ?? ""}
          />
        </div>

        <Field
          label="URL รูปสินค้า"
          name="thumbnail_url"
          defaultValue={product?.thumbnail_url ?? ""}
          placeholder="วางลิงก์รูปจาก Supabase Storage (เว้นว่างได้)"
        />

        <label className="block">
          <span className="text-sm font-medium">คำอธิบายสั้น</span>
          <textarea
            name="summary"
            rows={3}
            defaultValue={product?.summary ?? ""}
            className={field}
            placeholder="อธิบายจุดขายสั้น ๆ 1-2 ประโยค"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">เหมาะกับการถ่าย</span>
            <textarea
              name="best_for"
              rows={3}
              defaultValue={product?.best_for?.join("\n") ?? ""}
              className={field}
              placeholder={"บรรทัดละคำ\nportrait\ntravel"}
            />
            <span className="mt-1 block text-xs text-ink-400">
              ใช้คำอังกฤษสั้น ๆ เช่น portrait, travel, sport, street, night
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-medium">จุดเด่น</span>
            <textarea
              name="highlight"
              rows={3}
              defaultValue={product?.highlight?.join("\n") ?? ""}
              className={field}
              placeholder={"บรรทัดละข้อ\nFull Frame ในบอดี้เล็ก\nIBIS 7 stop"}
            />
          </label>
        </div>
      </section>

      {type === "camera" && (
        <section className="space-y-4 rounded-card border border-ink-100 p-5">
          <h2 className="font-bold">สเปกกล้อง</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="ประเภทบอดี้" name="body_type" defaultValue={cam?.body_type} placeholder="Compact" />
            <Field label="ขนาดเซนเซอร์" name="sensor_size" defaultValue={cam?.sensor_size} placeholder="Full Frame" />
            <Field label="ชนิดเซนเซอร์" name="sensor_type" defaultValue={cam?.sensor_type} placeholder="BSI-CMOS" />
            <Field label="ความละเอียด (MP)" name="megapixels" type="number" step="0.1" defaultValue={cam?.megapixels} />
            <Field label="ภาพสูงสุด" name="max_resolution" defaultValue={cam?.max_resolution} placeholder="7008 x 4672" />
            <Field label="ถ่ายต่อเนื่อง (fps)" name="fps_burst" type="number" step="0.1" defaultValue={cam?.fps_burst} />
            <Field label="ISO ต่ำสุด" name="iso_min" type="number" defaultValue={cam?.iso_min} />
            <Field label="ISO สูงสุด" name="iso_max" type="number" defaultValue={cam?.iso_max} />
            <Field label="วิดีโอสูงสุด" name="video_max" defaultValue={cam?.video_max} placeholder="4K 60p" />
            <Field label="ชัตเตอร์ช้าสุด" name="shutter_min" defaultValue={cam?.shutter_min} placeholder="30s" />
            <Field label="ชัตเตอร์เร็วสุด" name="shutter_max" defaultValue={cam?.shutter_max} placeholder="1/4000" />
            <Field label="แบตต่อชาร์จ (ภาพ)" name="battery_shots" type="number" defaultValue={cam?.battery_shots} />
            <Field label="จอ" name="screen_type" defaultValue={cam?.screen_type} />
            <Field label="ช่องมองภาพ" name="viewfinder" defaultValue={cam?.viewfinder} />
            <Field label="น้ำหนัก (กรัม)" name="weight_g" type="number" defaultValue={cam?.weight_g} />
            <Field label="ขนาด (มม.)" name="dimensions_mm" defaultValue={cam?.dimensions_mm} placeholder="124 x 71 x 63" />
          </div>
          <div className="flex flex-wrap gap-6">
            <Check label="มีกันสั่นในบอดี้ (IBIS)" name="ibis" defaultChecked={cam?.ibis} />
            <Check label="กันละอองน้ำ/ฝุ่น" name="weather_sealed" defaultChecked={cam?.weather_sealed} />
          </div>
        </section>
      )}

      {type === "lens" && (
        <section className="space-y-4 rounded-card border border-ink-100 p-5">
          <h2 className="font-bold">สเปกเลนส์</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="ทางยาวโฟกัสต่ำสุด (มม.)" name="focal_min_mm" type="number" step="0.1" defaultValue={lens?.focal_min_mm} />
            <Field label="ทางยาวโฟกัสสูงสุด (มม.)" name="focal_max_mm" type="number" step="0.1" defaultValue={lens?.focal_max_mm} />
            <Field label="เมาท์" name="mount" defaultValue={lens?.mount} placeholder="Sony E" />
            <Field label="รูรับแสงกว้างสุด (f/)" name="aperture_max" type="number" step="0.1" defaultValue={lens?.aperture_max} />
            <Field label="รูรับแสงแคบสุด (f/)" name="aperture_min" type="number" step="0.1" defaultValue={lens?.aperture_min} />
            <Field label="ขนาดฟิลเตอร์ (มม.)" name="filter_thread_mm" type="number" defaultValue={lens?.filter_thread_mm} />
            <Field label="ระยะโฟกัสใกล้สุด (ซม.)" name="min_focus_cm" type="number" step="0.1" defaultValue={lens?.min_focus_cm} />
            <Field label="น้ำหนัก (กรัม)" name="lens_weight_g" type="number" defaultValue={lens?.weight_g} />
          </div>
          <div className="flex flex-wrap gap-6">
            <Check label="เลนส์ฟิกซ์ (ไม่ใช่ซูม)" name="is_prime" defaultChecked={lens?.is_prime} />
            <Check label="มีกันสั่นในเลนส์" name="stabilization" defaultChecked={lens?.stabilization} />
          </div>
        </section>
      )}

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="กำลังบันทึก…">
        {product ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}
      </SubmitButton>
    </form>
  );
}
