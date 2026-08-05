-- =====================================================================
-- CamPare Community — Schema
-- รันไฟล์นี้ใน Supabase Dashboard > SQL Editor (รันตามลำดับ 0001 -> 0002 -> 0003)
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------------
-- ENUM
-- ---------------------------------------------------------------------
create type user_role        as enum ('user', 'admin');
create type product_type     as enum ('camera', 'lens', 'grip', 'tripod', 'filter', 'strap');
create type production_status as enum ('in_production', 'discontinued', 'announced');
create type item_condition   as enum ('new', 'like_new', 'good', 'fair', 'for_parts');
create type listing_status   as enum ('draft', 'active', 'reserved', 'sold', 'hidden');
create type order_status     as enum ('pending', 'paid', 'shipped', 'completed', 'cancelled');
create type payment_method   as enum ('mobile_banking', 'cash', 'credit_debit_card', 'coin');
create type moderation_status as enum ('pending', 'approved', 'rejected');
create type target_type      as enum ('product', 'listing', 'review', 'post', 'comment', 'photo', 'user');
create type notification_type as enum ('wishlist_available', 'new_review', 'question_answered', 'order_update', 'moderation');

-- ---------------------------------------------------------------------
-- 1. USER MANAGEMENT
--    profiles ต่อ 1:1 กับ auth.users ของ Supabase (ไม่เก็บรหัสผ่านเอง)
-- ---------------------------------------------------------------------
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  display_name  text not null,
  email         text,
  phone         text,
  avatar_url    text,
  bio           text,
  role          user_role not null default 'user',
  is_deleted    boolean not null default false,   -- soft delete
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- สร้าง profile อัตโนมัติเมื่อสมัครสมาชิกสำเร็จ
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. PRODUCT DATABASE  (header + subtype tables)
-- ---------------------------------------------------------------------
create table companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  country     text,
  logo_url    text,
  founded_year smallint,
  created_at  timestamptz not null default now()
);

-- ตารางหลัก: ทุกสินค้าไม่ว่าจะประเภทไหนมีแถวที่นี่ 1 แถว
create table products (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  product_no        text not null unique,          -- รหัสสินค้า เช่น SNY-A7C2
  name              text not null,
  product_type      product_type not null,
  company_id        uuid not null references companies(id) on delete restrict,
  announced_date    date,
  status            production_status not null default 'in_production',
  msrp              numeric(12,2),                 -- ราคาตั้งต้น (บาท)
  market_price      numeric(12,2),                 -- ราคากลางมือสอง คำนวณจาก listings
  thumbnail_url     text,
  summary           text,
  best_for          text[] default '{}',           -- เหมาะกับการถ่ายแบบไหน เช่น {portrait,travel,night}
  highlight         text[] default '{}',           -- จุดเด่นสั้น ๆ สำหรับหน้า compare
  avg_rating        numeric(2,1) not null default 0,
  review_count      integer not null default 0,
  is_deleted        boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index products_type_idx    on products(product_type) where is_deleted = false;
create index products_company_idx on products(company_id);
create index products_name_trgm   on products using gin (name gin_trgm_ops);

-- subtype 1:1 — มีเฉพาะสินค้าที่ product_type ตรงกัน
create table camera_specs (
  product_id        uuid primary key references products(id) on delete cascade,
  body_type         text,                -- Ultracompact / Compact / DSLR / Mirrorless
  sensor_size       text,                -- Full Frame / APS-C / MFT
  sensor_type       text,                -- CMOS / BSI-CMOS
  megapixels        numeric(5,1),
  max_resolution    text,                -- 4000 x 3000
  iso_min           integer,
  iso_max           integer,
  shutter_min       text,
  shutter_max       text,
  fps_burst         numeric(4,1),
  video_max         text,                -- 4K 60p
  ibis              boolean default false,
  weather_sealed    boolean default false,
  screen_type       text,
  viewfinder        text,
  battery_shots     integer,
  weight_g          integer,
  dimensions_mm     text,
  lens_mount_id     uuid references companies(id)  -- เมาท์ของค่ายไหน
);

create table lens_specs (
  product_id        uuid primary key references products(id) on delete cascade,
  focal_min_mm      numeric(6,1),
  focal_max_mm      numeric(6,1),
  aperture_max      numeric(4,1),        -- f/1.8 -> 1.8
  aperture_min      numeric(4,1),
  mount             text,
  is_prime          boolean default false,
  stabilization     boolean default false,
  filter_thread_mm  integer,
  min_focus_cm      numeric(6,1),
  weight_g          integer
);

create table tripod_specs (
  product_id        uuid primary key references products(id) on delete cascade,
  material          text,
  max_height_cm     numeric(6,1),
  min_height_cm     numeric(6,1),
  folded_length_cm  numeric(6,1),
  load_capacity_kg  numeric(6,2),
  leg_sections      smallint,
  head_type         text,
  weight_g          integer
);

create table filter_specs (
  product_id        uuid primary key references products(id) on delete cascade,
  filter_type       text,                -- UV / CPL / ND
  thread_size_mm    integer,
  nd_stops          numeric(4,1),
  coating           text
);

create table strap_specs (
  product_id        uuid primary key references products(id) on delete cascade,
  material          text,
  length_cm         numeric(6,1),
  attachment_type   text,
  quick_release     boolean default false
);

create table grip_specs (
  product_id        uuid primary key references products(id) on delete cascade,
  battery_count     smallint,
  has_shutter_btn   boolean default false,
  weather_sealed    boolean default false,
  weight_g          integer
);

-- ความเข้ากันได้ระหว่างสินค้า (กล้อง <-> เลนส์ <-> กริป)
create table product_compatibility (
  product_id        uuid not null references products(id) on delete cascade,
  compatible_with   uuid not null references products(id) on delete cascade,
  note              text,
  primary key (product_id, compatible_with),
  check (product_id <> compatible_with)
);

create table product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products(id) on delete cascade,
  url           text not null,
  alt           text,
  sort_order    smallint not null default 0
);

create index product_images_product_idx on product_images(product_id);

-- ---------------------------------------------------------------------
-- 3. MARKETPLACE — ประกาศขายมือสอง
--    สภาพ/ประกัน อยู่ที่ระดับ listing ไม่ใช่ระดับรุ่นสินค้า
-- ---------------------------------------------------------------------
create table listings (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references products(id) on delete restrict,
  seller_id         uuid not null references profiles(id) on delete cascade,
  title             text not null,
  price             numeric(12,2) not null check (price >= 0),
  quantity          integer not null default 1 check (quantity >= 0),
  condition         item_condition not null default 'good',
  warranty_expire_date date,                       -- เก็บเป็นวันที่ ไม่ใช่ enum
  shutter_count     integer,
  description       text,
  province          text,
  status            listing_status not null default 'active',
  is_deleted        boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index listings_product_idx on listings(product_id) where status = 'active';
create index listings_seller_idx  on listings(seller_id);

create table listing_images (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references listings(id) on delete cascade,
  url         text not null,
  sort_order  smallint not null default 0
);

-- ตะกร้า: 1 user มี 1 ตะกร้า
create table carts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table cart_items (
  id          uuid primary key default gen_random_uuid(),
  cart_id     uuid not null references carts(id) on delete cascade,
  listing_id  uuid not null references listings(id) on delete cascade,
  quantity    integer not null default 1 check (quantity > 0),
  selected    boolean not null default true,
  added_at    timestamptz not null default now(),
  unique (cart_id, listing_id)
);

-- Header–detail: orders คือหัวบิล, order_items คือรายการในบิล
create table orders (
  id                uuid primary key default gen_random_uuid(),
  order_no          text not null unique,
  buyer_id          uuid not null references profiles(id) on delete restrict,
  status            order_status not null default 'pending',
  payment_method    payment_method,
  shipping_address  text,
  subtotal          numeric(12,2) not null default 0,
  shipping_fee      numeric(12,2) not null default 0,
  total             numeric(12,2) not null default 0,
  ordered_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  listing_id    uuid references listings(id) on delete set null,
  product_id    uuid not null references products(id) on delete restrict,
  product_name  text not null,          -- snapshot ณ เวลาสั่งซื้อ
  unit_price    numeric(12,2) not null,
  quantity      integer not null check (quantity > 0),
  line_total    numeric(12,2) generated always as (unit_price * quantity) stored
);

create index order_items_order_idx on order_items(order_id);

-- ---------------------------------------------------------------------
-- 4. WISHLIST / FAVORITE
-- ---------------------------------------------------------------------
create table wishlists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  name        text not null default 'ของที่อยากได้',
  is_default  boolean not null default true,
  created_at  timestamptz not null default now()
);

create table wishlist_items (
  id            uuid primary key default gen_random_uuid(),
  wishlist_id   uuid not null references wishlists(id) on delete cascade,
  product_id    uuid not null references products(id) on delete cascade,
  target_price  numeric(12,2),          -- แจ้งเตือนเมื่อมีของต่ำกว่าราคานี้
  notify        boolean not null default true,
  added_at      timestamptz not null default now(),
  unique (wishlist_id, product_id)
);

-- ---------------------------------------------------------------------
-- 5. REVIEW
-- ---------------------------------------------------------------------
create table reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  author_id   uuid not null references profiles(id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  title       text,
  body        text,
  pros        text[] default '{}',
  cons        text[] default '{}',
  helpful_count integer not null default 0,
  status      moderation_status not null default 'approved',
  is_deleted  boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (product_id, author_id)         -- 1 คน รีวิว 1 รุ่น ได้ครั้งเดียว
);

create index reviews_product_idx on reviews(product_id) where is_deleted = false;

-- อัปเดตคะแนนเฉลี่ยของสินค้าอัตโนมัติ
create or replace function public.refresh_product_rating()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  pid uuid := coalesce(new.product_id, old.product_id);
begin
  update products p
  set avg_rating = coalesce(round(sub.avg_rating, 1), 0),
      review_count = coalesce(sub.cnt, 0)
  from (
    select avg(rating)::numeric as avg_rating, count(*) as cnt
    from reviews
    where product_id = pid and is_deleted = false and status = 'approved'
  ) sub
  where p.id = pid;
  return null;
end;
$$;

create trigger reviews_rating_sync
  after insert or update or delete on reviews
  for each row execute function public.refresh_product_rating();

-- ---------------------------------------------------------------------
-- 6. SAMPLE GALLERY
-- ---------------------------------------------------------------------
create table gallery_photos (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references profiles(id) on delete cascade,
  product_id    uuid references products(id) on delete set null,   -- คลิกไปหน้าสินค้าได้
  lens_id       uuid references products(id) on delete set null,
  title         text,
  image_url     text not null,
  original_url  text,                  -- ไฟล์ต้นฉบับ (RAW/JPEG เต็ม)
  shot_iso      integer,
  shot_aperture numeric(4,1),
  shot_shutter  text,
  shot_focal_mm numeric(6,1),
  taken_at      timestamptz,
  status        moderation_status not null default 'pending',
  is_deleted    boolean not null default false,
  created_at    timestamptz not null default now()
);

create index gallery_status_idx on gallery_photos(status, created_at desc);

-- ---------------------------------------------------------------------
-- 7. COMMUNITY (ถาม-ตอบ / แชร์ประสบการณ์)
-- ---------------------------------------------------------------------
create table community_posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references profiles(id) on delete cascade,
  product_id  uuid references products(id) on delete set null,
  title       text not null,
  body        text not null,
  tags        text[] default '{}',
  is_question boolean not null default false,
  status      moderation_status not null default 'pending',
  is_deleted  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- คอมเมนต์ใช้ร่วมกันทั้งโพสต์และรูปในแกลเลอรี (polymorphic)
create table comments (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references profiles(id) on delete cascade,
  target_type   target_type not null,
  target_id     uuid not null,
  parent_id     uuid references comments(id) on delete cascade,
  body          text not null,
  is_answer     boolean not null default false,
  is_deleted    boolean not null default false,
  created_at    timestamptz not null default now()
);

create index comments_target_idx on comments(target_type, target_id);

create table follows (
  follower_id  uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- ---------------------------------------------------------------------
-- 8. COMPARE SYSTEM (เก็บชุดเปรียบเทียบไว้ดูภายหลัง 2–4 รุ่น)
-- ---------------------------------------------------------------------
create table compare_sets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  name        text,
  created_at  timestamptz not null default now()
);

create table compare_items (
  compare_set_id uuid not null references compare_sets(id) on delete cascade,
  product_id     uuid not null references products(id) on delete cascade,
  position       smallint not null check (position between 1 and 4),
  primary key (compare_set_id, product_id)
);

-- ---------------------------------------------------------------------
-- 9. NOTIFICATION + SEARCH HISTORY
-- ---------------------------------------------------------------------
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  type        notification_type not null,
  title       text not null,
  body        text,
  link        text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index notifications_user_idx on notifications(user_id, is_read, created_at desc);

create table search_history (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  keyword     text not null,
  filters     jsonb,
  searched_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 10. ADMIN / MODERATION — polymorphic target
-- ---------------------------------------------------------------------
create table reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid not null references profiles(id) on delete cascade,
  target_type   target_type not null,
  target_id     uuid not null,
  reason        text not null,
  detail        text,
  status        moderation_status not null default 'pending',
  handled_by    uuid references profiles(id) on delete set null,
  handled_at    timestamptz,
  created_at    timestamptz not null default now()
);

create index reports_status_idx on reports(status, created_at desc);

-- ---------------------------------------------------------------------
-- updated_at trigger ใช้ร่วมกันทุกตาราง
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch  before update on profiles  for each row execute function public.touch_updated_at();
create trigger products_touch  before update on products  for each row execute function public.touch_updated_at();
create trigger listings_touch  before update on listings  for each row execute function public.touch_updated_at();
create trigger orders_touch    before update on orders    for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- VIEW: ราคากลางมือสองต่อรุ่น (ใช้ในหน้า Product Detail / Compare)
-- ---------------------------------------------------------------------
-- security_invoker = on : ให้ view ใช้สิทธิ์ของผู้เรียก ไม่ใช่ผู้สร้าง (RLS จึงยังทำงาน)
create view product_market_price
with (security_invoker = on)
as
select
  p.id as product_id,
  count(l.id)                       as active_listings,
  min(l.price)                      as min_price,
  max(l.price)                      as max_price,
  round(avg(l.price)::numeric, 2)   as avg_price,
  percentile_cont(0.5) within group (order by l.price) as median_price
from products p
left join listings l
  on l.product_id = p.id and l.status = 'active' and l.is_deleted = false
group by p.id;
