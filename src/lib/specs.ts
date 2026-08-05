import type { Product } from "@/lib/types";

export type SpecRow = { label: string; value: (p: Product) => string };

const yn = (v: boolean | null | undefined) => (v ? "มี" : "ไม่มี");
const dash = (v: unknown, suffix = "") =>
  v === null || v === undefined || v === "" ? "—" : `${v}${suffix}`;

export const BASIC_ROWS: SpecRow[] = [
  { label: "แบรนด์", value: (p) => dash(p.companies?.name) },
  { label: "รหัสสินค้า", value: (p) => p.product_no },
  {
    label: "วันเปิดตัว",
    value: (p) =>
      p.announced_date
        ? new Date(p.announced_date).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "—",
  },
  {
    label: "สถานะการผลิต",
    value: (p) =>
      p.status === "in_production"
        ? "ยังผลิตอยู่"
        : p.status === "discontinued"
          ? "เลิกผลิตแล้ว"
          : "เพิ่งเปิดตัว",
  },
];

export const CAMERA_ROWS: SpecRow[] = [
  { label: "ประเภทบอดี้", value: (p) => dash(p.camera_specs?.body_type) },
  { label: "ขนาดเซนเซอร์", value: (p) => dash(p.camera_specs?.sensor_size) },
  { label: "ชนิดเซนเซอร์", value: (p) => dash(p.camera_specs?.sensor_type) },
  { label: "ความละเอียด", value: (p) => dash(p.camera_specs?.megapixels, " MP") },
  { label: "ภาพสูงสุด", value: (p) => dash(p.camera_specs?.max_resolution) },
  {
    label: "ช่วง ISO",
    value: (p) =>
      p.camera_specs?.iso_min && p.camera_specs?.iso_max
        ? `${p.camera_specs.iso_min} – ${p.camera_specs.iso_max}`
        : "—",
  },
  {
    label: "ชัตเตอร์",
    value: (p) =>
      p.camera_specs?.shutter_min && p.camera_specs?.shutter_max
        ? `${p.camera_specs.shutter_min} – ${p.camera_specs.shutter_max}`
        : "—",
  },
  { label: "ถ่ายต่อเนื่อง", value: (p) => dash(p.camera_specs?.fps_burst, " fps") },
  { label: "วิดีโอสูงสุด", value: (p) => dash(p.camera_specs?.video_max) },
  { label: "กันสั่นในบอดี้ (IBIS)", value: (p) => yn(p.camera_specs?.ibis) },
  { label: "กันละอองน้ำ/ฝุ่น", value: (p) => yn(p.camera_specs?.weather_sealed) },
  { label: "จอ", value: (p) => dash(p.camera_specs?.screen_type) },
  { label: "ช่องมองภาพ", value: (p) => dash(p.camera_specs?.viewfinder) },
  { label: "แบตต่อชาร์จ", value: (p) => dash(p.camera_specs?.battery_shots, " ภาพ") },
  { label: "น้ำหนัก", value: (p) => dash(p.camera_specs?.weight_g, " ก.") },
  { label: "ขนาด (มม.)", value: (p) => dash(p.camera_specs?.dimensions_mm) },
];

export const LENS_ROWS: SpecRow[] = [
  {
    label: "ทางยาวโฟกัส",
    value: (p) => {
      const s = p.lens_specs;
      if (!s?.focal_min_mm) return "—";
      return s.focal_min_mm === s.focal_max_mm
        ? `${s.focal_min_mm} มม.`
        : `${s.focal_min_mm}–${s.focal_max_mm} มม.`;
    },
  },
  { label: "รูรับแสงกว้างสุด", value: (p) => (p.lens_specs?.aperture_max ? `f/${p.lens_specs.aperture_max}` : "—") },
  { label: "เมาท์", value: (p) => dash(p.lens_specs?.mount) },
  { label: "ฟิกซ์/ซูม", value: (p) => (p.lens_specs?.is_prime ? "ฟิกซ์" : "ซูม") },
  { label: "กันสั่นในเลนส์", value: (p) => yn(p.lens_specs?.stabilization) },
  { label: "ขนาดฟิลเตอร์", value: (p) => dash(p.lens_specs?.filter_thread_mm, " มม.") },
  { label: "ระยะโฟกัสใกล้สุด", value: (p) => dash(p.lens_specs?.min_focus_cm, " ซม.") },
  { label: "น้ำหนัก", value: (p) => dash(p.lens_specs?.weight_g, " ก.") },
];

/** เลือกชุดสเปกตามประเภทสินค้า */
export function specGroupsFor(p: Product): { title: string; rows: SpecRow[] }[] {
  const groups = [{ title: "ข้อมูลพื้นฐาน", rows: BASIC_ROWS }];
  if (p.product_type === "camera")
    groups.push({ title: "สเปกกล้อง", rows: CAMERA_ROWS });
  if (p.product_type === "lens")
    groups.push({ title: "สเปกเลนส์", rows: LENS_ROWS });
  return groups;
}
