# CamPare Community

แพลตฟอร์มเปรียบเทียบสเปกกล้อง + ตลาดมือสอง (โปรเจกต์รายวิชา System Analysis and Design)

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase · Vercel

---

## เริ่มใช้งาน (3 ขั้น)

### 1. ติดตั้งและรัน

```bash
npm install
npm run dev
```

เปิด http://localhost:3000 — ตอนนี้เว็บจะรันด้วย **ข้อมูลตัวอย่าง** (mock) ได้เลย ยังไม่ต้องมี Supabase

### 2. สร้าง Supabase project

1. ไปที่ https://supabase.com → New project (เลือก region **Southeast Asia (Singapore)** จะเร็วสุด)
2. เข้า **SQL Editor** แล้วรันไฟล์ตามลำดับ:
   - `supabase/migrations/0001_schema.sql` — ตาราง, enum, trigger, view
   - `supabase/migrations/0002_rls.sql` — Row Level Security
   - `supabase/migrations/0003_seed.sql` — ข้อมูลสินค้าตัวอย่าง
3. คัดลอก `.env.example` เป็น `.env.local` แล้วใส่ค่าจาก **Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

4. รีสตาร์ท `npm run dev` — แถบ "กำลังแสดงข้อมูลตัวอย่าง" จะหายไป แปลว่าต่อ DB ติดแล้ว

### 3. Deploy ขึ้น Vercel

```bash
npx vercel
```

หรือ push ขึ้น GitHub แล้ว Import repo ที่ https://vercel.com/new

ใน Vercel ต้องใส่ Environment Variables 2 ตัวเหมือนใน `.env.local`
(Settings → Environment Variables → เลือกครบทั้ง Production/Preview/Development)

จากนั้นกลับไปที่ Supabase → **Authentication → URL Configuration**
เพิ่ม URL ของ Vercel ลงใน **Redirect URLs**:

```
https://ชื่อโปรเจกต์.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

---

## โครงสร้างโปรเจกต์

```
src/
├── app/
│   ├── page.tsx              หน้าแรก — hero, ประเภทสินค้า, สินค้าแนะนำ, แบรนด์
│   ├── category/             หน้ารวมสินค้า + ตัวกรอง (ราคา/ประเภท/แบรนด์/คะแนน)
│   ├── product/[slug]/       หน้ารายละเอียดสินค้า — สเปก, ประกาศขาย, รีวิว
│   ├── compare/              เปรียบเทียบ 2–4 รุ่น side-by-side
│   ├── login/ register/      หน้าสมัคร/เข้าสู่ระบบ (+ Google, Facebook)
│   ├── profile/              โปรไฟล์ 4 แท็บ: ข้อมูล, ประวัติซื้อ, รีวิว, รายการโปรด
│   ├── about/                อธิบายฟังก์ชันทั้ง 10 ข้อตาม requirement
│   └── auth/                 server actions + OAuth callback
├── components/               UI ที่ใช้ซ้ำ (card, filter, header, footer, ปุ่ม)
├── lib/
│   ├── supabase/             client ฝั่ง browser / server / middleware
│   ├── queries.ts            ชั้นดึงข้อมูล — ถ้ายังไม่ต่อ DB จะ fallback เป็น mock อัตโนมัติ
│   ├── specs.ts              นิยามแถวสเปกที่ใช้ทั้งหน้า detail และหน้า compare
│   ├── types.ts              type + คำแปลไทยของ enum
│   └── mock-data.ts          ข้อมูลตัวอย่าง (ตรงกับ 0003_seed.sql)
└── middleware.ts             รีเฟรช session + กันหน้าที่ต้องล็อกอิน
```

---

## หมายเหตุเรื่องฐานข้อมูล (สำหรับทีม Database)

ประเด็นออกแบบที่ใส่ไว้แล้วใน `0001_schema.sql`:

- **Header–detail** — `orders` (หัวบิล) แยกจาก `order_items` (รายการในบิล) แทนที่จะยัดรวมตารางเดียว
- **Polymorphic reference** — `comments` และ `reports` ใช้ `target_type` + `target_id`
  ชี้ไปได้ทั้งโพสต์ รูป รีวิว หรือผู้ใช้ โดยไม่ต้องสร้างตารางแยกต่อชนิด
- **Subtype tables** — `products` เป็นตารางแม่ ส่วน `camera_specs` / `lens_specs` / `tripod_specs` ฯลฯ
  เป็น 1:1 ตามประเภท ทำให้ไม่มีคอลัมน์ว่างเปล่าเต็มตาราง
- **Soft delete** — ใช้ `is_deleted` แทนการลบจริง เพื่อไม่ให้ FK พัง
- **สภาพ/ประกันอยู่ที่ระดับ listing** ไม่ใช่ระดับรุ่นสินค้า — `warranty_expire_date` เก็บเป็น `date`
- **ไม่แยกตารางตามสถานะ** (เช่น active/completed) เพราะไม่ประหยัดพื้นที่และทำให้ FK ยุ่ง
- **`product_market_price`** เป็น view คำนวณราคากลาง/ต่ำสุด/สูงสุดจากประกาศที่ยัง active

### สร้าง admin คนแรก

หลังสมัครสมาชิกผ่านหน้าเว็บแล้ว รันใน SQL Editor:

```sql
update profiles set role = 'admin' where email = 'อีเมลของคุณ';
```

### generate TypeScript types จาก schema จริง

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npm run types
```

---

## สถานะ

ครบทั้ง 10 functional requirements แล้ว — User Management, Product Database,
Compare System, Sample Gallery, Review System, Marketplace, Favorite/Wishlist,
Community, Notification, Admin

### ไอเดียต่อยอด (ถ้ามีเวลาเหลือ)

- [ ] AI วิเคราะห์ว่ารุ่นไหนคุ้มกว่าจากสเปก + ราคากลาง
- [ ] กราฟแนวโน้มราคามือสองย้อนหลัง
- [ ] แชทระหว่างผู้ซื้อ-ผู้ขาย
- [ ] Realtime notification ด้วย Supabase Realtime (ตอนนี้อัปเดตตอนโหลดหน้า)
