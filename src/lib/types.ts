/**
 * Types ที่ใช้ในแอป — เขียนมือไว้ก่อนเพื่อให้ build ผ่านตั้งแต่ยังไม่ได้ต่อ DB จริง
 * เมื่อ Supabase project พร้อมแล้ว รัน `npm run types` เพื่อ generate จาก schema จริง
 */

export type ProductType = "camera" | "lens" | "grip" | "tripod" | "filter" | "strap";
export type ProductionStatus = "in_production" | "discontinued" | "announced";
export type UserRole = "user" | "admin";
export type ItemCondition = "new" | "like_new" | "good" | "fair" | "for_parts";

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  camera: "กล้อง",
  lens: "เลนส์",
  grip: "กริป",
  tripod: "ขาตั้งกล้อง",
  filter: "ฟิลเตอร์",
  strap: "สายคล้อง",
};

export const STATUS_LABEL: Record<ProductionStatus, string> = {
  in_production: "ยังผลิตอยู่",
  discontinued: "เลิกผลิตแล้ว",
  announced: "เพิ่งเปิดตัว",
};

export const CONDITION_LABEL: Record<ItemCondition, string> = {
  new: "ของใหม่",
  like_new: "สภาพเหมือนใหม่",
  good: "สภาพดี",
  fair: "พอใช้",
  for_parts: "อะไหล่",
};

export const BEST_FOR_LABEL: Record<string, string> = {
  portrait: "ถ่ายบุคคล",
  travel: "ท่องเที่ยว",
  vlog: "ทำคลิป/วล็อก",
  sport: "กีฬา/เคลื่อนไหวเร็ว",
  street: "สตรีท",
  landscape: "วิว/แลนด์สเคป",
  wildlife: "สัตว์ป่า/นก",
  night: "กลางคืน",
  wedding: "งานแต่ง/อีเวนต์",
  beginner: "มือใหม่",
  daily: "ใช้ทั่วไป",
  video: "งานวิดีโอ",
};

export type Company = {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  logo_url: string | null;
};

export type CameraSpecs = {
  product_id: string;
  body_type: string | null;
  sensor_size: string | null;
  sensor_type: string | null;
  megapixels: number | null;
  max_resolution: string | null;
  iso_min: number | null;
  iso_max: number | null;
  shutter_min: string | null;
  shutter_max: string | null;
  fps_burst: number | null;
  video_max: string | null;
  ibis: boolean | null;
  weather_sealed: boolean | null;
  screen_type: string | null;
  viewfinder: string | null;
  battery_shots: number | null;
  weight_g: number | null;
  dimensions_mm: string | null;
};

export type LensSpecs = {
  product_id: string;
  focal_min_mm: number | null;
  focal_max_mm: number | null;
  aperture_max: number | null;
  aperture_min: number | null;
  mount: string | null;
  is_prime: boolean | null;
  stabilization: boolean | null;
  filter_thread_mm: number | null;
  min_focus_cm: number | null;
  weight_g: number | null;
};

export type Product = {
  id: string;
  slug: string;
  product_no: string;
  name: string;
  product_type: ProductType;
  company_id: string;
  announced_date: string | null;
  /** ใช้เมื่อรู้แค่ปี ไม่มีวันที่เต็ม (ข้อมูลที่นำเข้าจากภายนอก) */
  release_year?: number | null;
  /** URL ที่ใช้อ้างอิงราคา — แสดงบนหน้าสินค้าให้ตรวจสอบได้ */
  price_source_url?: string | null;
  price_checked_at?: string | null;
  status: ProductionStatus;
  msrp: number | null;
  market_price: number | null;
  thumbnail_url: string | null;
  summary: string | null;
  best_for: string[] | null;
  highlight: string[] | null;
  avg_rating: number;
  review_count: number;
  companies?: Company | null;
  camera_specs?: CameraSpecs | null;
  lens_specs?: LensSpecs | null;
};

/** รูปแบบเบาสำหรับ dropdown / แถบกรอง — ไม่มีสเปกและแบรนด์ */
export type ProductOption = {
  id: string;
  slug: string;
  name: string;
  product_no: string;
  product_type: ProductType;
  msrp: number | null;
  market_price: number | null;
};

export type Review = {
  id: string;
  product_id: string;
  author_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  pros: string[] | null;
  cons: string[] | null;
  helpful_count: number;
  created_at: string;
  profiles?: { display_name: string; avatar_url: string | null } | null;
};

export type Listing = {
  id: string;
  product_id: string;
  seller_id: string;
  title: string;
  price: number;
  quantity: number;
  condition: ItemCondition;
  warranty_expire_date: string | null;
  shutter_count: number | null;
  description: string | null;
  province: string | null;
  created_at: string;
  profiles?: { display_name: string; avatar_url: string | null } | null;
};

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  created_at: string;
};

export type OrderRow = {
  id: string;
  order_no: string;
  status: string;
  total: number;
  ordered_at: string;
  order_items: {
    id: string;
    product_name: string;
    unit_price: number;
    quantity: number;
  }[];
};
