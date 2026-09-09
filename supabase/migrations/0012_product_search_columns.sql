-- =====================================================================
-- เตรียม products ให้รับข้อมูลระดับหลักพันได้
--
-- ปัญหา: เดิมหน้ารวมสินค้าดึงมา 200 แถวแล้วกรอง/เรียงในโค้ด JavaScript
-- ซึ่งใช้ได้ตอนมีสินค้า 14 ชิ้น แต่พอมี 3,860 ชิ้นจะกลายเป็น
--   1) เห็นไม่ครบ เพราะตัดที่ 200 แถวแรกก่อนกรอง
--   2) ช้า เพราะลากข้อมูลที่ไม่ได้ใช้ข้ามเน็ตมาทุกครั้ง
--
-- ทางแก้: ย้ายการกรองและเรียงไปทำที่ฐานข้อมูล แล้วดึงมาทีละหน้า
-- แต่เงื่อนไขที่ใช้บ่อยเป็นนิพจน์ (coalesce ของสองคอลัมน์) ซึ่งกรอง
-- ผ่าน PostgREST ตรง ๆ ไม่ได้และทำ index ไม่ได้ จึงทำเป็น generated column
-- =====================================================================

-- ราคาที่ใช้แสดงและเรียง — ราคากลางมือสองมาก่อน ถ้าไม่มีค่อยใช้ราคาป้าย
-- stored = คำนวณตอนเขียน เก็บค่าไว้จริง จึงทำ index ได้
alter table products
  add column if not exists display_price numeric(12,2)
  generated always as (coalesce(market_price, msrp)) stored;

-- วันที่ใช้เรียง "มาใหม่ล่าสุด" — วันที่เต็มถ้ามี ไม่งั้นถือว่าเป็นต้นปีนั้น
-- make_date เป็น immutable จึงใช้ใน generated column ได้
alter table products
  add column if not exists released_on date
  generated always as (
    coalesce(announced_date, make_date(release_year::int, 1, 1))
  ) stored;

comment on column products.display_price is
  'ราคาที่ใช้แสดง/กรอง/เรียง = coalesce(market_price, msrp) — คำนวณอัตโนมัติ';
comment on column products.released_on is
  'วันที่ใช้เรียงตามความใหม่ = announced_date หรือ 1 ม.ค. ของ release_year';

-- ---------------------------------------------------------------------
-- Index ตามเงื่อนไขที่หน้ารวมสินค้าใช้จริง
--
-- index ทำให้ฐานข้อมูลกระโดดไปหาแถวที่ต้องการได้เลย แทนที่จะไล่อ่านทีละแถว
-- จาก 3,860 แถว ต่างกันไม่มาก แต่เป็นนิสัยที่ควรมีตั้งแต่ตอนออกแบบ
-- partial index (where is_deleted = false) เล็กกว่าเพราะไม่เก็บแถวที่ซ่อนอยู่
-- ---------------------------------------------------------------------
create index if not exists products_type_active_idx
  on products(product_type) where is_deleted = false;

create index if not exists products_price_idx
  on products(display_price) where is_deleted = false;

create index if not exists products_released_idx
  on products(released_on desc) where is_deleted = false;

create index if not exists products_rating_idx
  on products(avg_rating desc) where is_deleted = false;

create index if not exists products_reviews_idx
  on products(review_count desc) where is_deleted = false;

-- ค้นหาชื่อแบบมีคำอยู่ตรงกลาง ('%a7c%') ใช้ index ปกติไม่ได้
-- ต้องใช้ trigram ซึ่งตัด index จากชิ้นส่วน 3 ตัวอักษร (pg_trgm เปิดไว้แล้วใน 0001)
create index if not exists products_name_trgm_idx
  on products using gin (name gin_trgm_ops);

-- ---------------------------------------------------------------------
-- ตรวจผล
-- ---------------------------------------------------------------------
select
  count(*)                                    as "สินค้าทั้งหมด",
  count(display_price)                        as "มีราคา",
  count(released_on)                          as "รู้ปีเปิดตัว",
  min(released_on)                            as "เก่าสุด",
  max(released_on)                            as "ใหม่สุด"
from products where is_deleted = false;
