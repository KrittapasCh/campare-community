-- =====================================================================
-- นำเข้าฐานข้อมูลกล้อง 3,860 รุ่น จาก CameraDatabase (MIT License)
-- https://github.com/leavestylecode/CameraDatabase
--
-- ก่อนรันไฟล์นี้: import data/camera_data.csv เข้า Supabase เป็นตาราง
-- ชื่อ camera_import ผ่าน Table Editor -> New table -> Import data from CSV
-- (คอลัมน์จะเป็น text ทั้งหมด ซึ่งถูกต้องแล้ว เราจะแปลงชนิดข้อมูลใน SQL)
--
-- ไฟล์นี้รันซ้ำได้ ถ้าแปลงผิดแก้แล้วรันใหม่ได้เลย ไม่ต้อง import ใหม่
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. เตรียมโครงสร้าง
-- ---------------------------------------------------------------------

-- ชุดข้อมูลนี้บอกแค่ "ปี" ที่เปิดตัว ไม่มีวันที่
-- การยัดเป็น YYYY-01-01 ลง announced_date จะทำให้หน้าเว็บแสดง "1 ม.ค." ซึ่งไม่จริง
-- เก็บเป็นปีตรง ๆ แล้วให้ UI เลือกแสดงเองว่ามีวันที่เต็มหรือมีแค่ปี
alter table products add column if not exists release_year smallint;

comment on column products.release_year is
  'ปีที่เปิดตัว ใช้เมื่อไม่มี announced_date แบบเต็มวันที่ (ข้อมูลนำเข้าจากภายนอก)';

-- slugify ใช้ร่วมกันทั้งตอนสร้าง products และตอน join camera_specs กลับ
-- ต้องเป็น immutable เพราะเรียกซ้ำกับค่าเดิมต้องได้ผลเดิมเสมอ
create or replace function public.slugify(txt text)
returns text language sql immutable as $$
  select trim(both '-' from regexp_replace(lower(coalesce(txt, '')), '[^a-z0-9]+', '-', 'g'));
$$;

-- ---------------------------------------------------------------------
-- 1. แบรนด์
--    ของเดิมมีอยู่แล้ว 9 แบรนด์จาก seed — on conflict กันไม่ให้ซ้ำ
--    และทำให้สินค้าที่ import เข้ามาผูกกับแถวแบรนด์เดิม ไม่ใช่สร้างใหม่
-- ---------------------------------------------------------------------
insert into companies (name, slug, country)
select distinct trim(i."Brand"), public.slugify(i."Brand"), null
from camera_import i
where trim(coalesce(i."Brand", '')) <> ''
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- 2. สินค้า
-- ---------------------------------------------------------------------
insert into products (
  slug, product_no, name, product_type, company_id,
  release_year, status, thumbnail_url, summary
)
select
  public.slugify(i."Brand" || '-' || i."Model")                       as slug,
  upper(public.slugify(i."Brand" || '-' || i."Model"))                as product_no,
  trim(i."Brand") || ' ' || trim(i."Model")                           as name,
  'camera'::product_type,
  c.id,
  nullif(regexp_replace(i."Year", '[^0-9]', '', 'g'), '')::smallint   as release_year,

  -- ชุดข้อมูลไม่ได้ระบุสถานะการผลิต จึงอนุมานจากปีที่เปิดตัว
  -- เกณฑ์: เปิดตัวปี 2022 ขึ้นไปถือว่ายังผลิตอยู่ ก่อนหน้านั้นถือว่าเลิกผลิตแล้ว
  -- (เป็นการอนุมาน ไม่ใช่ข้อมูลจากผู้ผลิต — ระบุไว้ในรายงานด้วย)
  case
    when nullif(regexp_replace(i."Year", '[^0-9]', '', 'g'), '')::int >= 2022
      then 'in_production'::production_status
    else 'discontinued'::production_status
  end,

  -- รูปเสิร์ฟผ่าน jsDelivr ซึ่งเป็น CDN สำหรับไฟล์ใน GitHub โดยเฉพาะ
  -- ไม่ต้องอัป 3,858 ไฟล์ขึ้น Supabase Storage และไม่กิน quota
  case
    when trim(coalesce(i."image_file", '')) <> ''
      then 'https://cdn.jsdelivr.net/gh/leavestylecode/CameraDatabase@main/' || i."image_file"
    else null
  end,

  -- คำอธิบายสั้น ประกอบจากสเปกที่มีจริง ข้ามช่องที่ว่าง
  nullif(
    concat_ws(' · ',
      nullif(trim(coalesce(i."Sensor type", '')), ''),
      case
        when coalesce(nullif(i."Effective megapixels", ''), nullif(i."Megapixels", '')) is not null
          then coalesce(nullif(i."Effective megapixels", ''), nullif(i."Megapixels", '')) || ' ล้านพิกเซล'
      end,
      nullif(split_part(trim(coalesce(i."Sensor size", '')), ' (', 1), ''),
      'เปิดตัวปี ' || i."Year"
    ), '')
from camera_import i
join companies c on c.name = trim(i."Brand")
where trim(coalesce(i."Brand", '')) <> ''
  and trim(coalesce(i."Model", '')) <> ''
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- 3. สเปกกล้อง
--
--    การแงะตัวเลขออกจากข้อความคือส่วนที่ต้องระวังที่สุด ตัวอย่างค่าจริง:
--      ISO        'Auto, 100-102400 (expandable to 50-819200)'
--      Weight     '180 g'
--      Dimensions '96 x 61 x 29 mm'
--      Shutter    '1/4000 sec'
--
--    ISO: ตัดตั้งแต่วงเล็บทิ้งก่อน เพราะช่วง expandable ไม่ใช่ ISO ปกติ
--         ถ้าไม่ตัด จะได้ค่าสูงสุดเป็น 3,280,000 ซึ่งทำให้ตัวกรองเพี้ยน
-- ---------------------------------------------------------------------
insert into camera_specs (
  product_id, sensor_type, sensor_size, megapixels, max_resolution,
  iso_min, iso_max, shutter_min, shutter_max, video_max,
  screen_type, viewfinder, weight_g, dimensions_mm
)
select
  p.id,
  nullif(trim(coalesce(i."Sensor type", '')), ''),
  nullif(trim(coalesce(i."Sensor size", '')), ''),

  nullif(regexp_replace(
    coalesce(nullif(i."Effective megapixels", ''),
             nullif(i."Megapixels", ''),
             nullif(i."Total megapixels", ''), ''),
    '[^0-9.]', '', 'g'), '')::numeric(5,1),

  nullif(trim(coalesce(i."Max. image resolution", '')), ''),

  iso.lo, iso.hi,

  nullif(trim(replace(coalesce(i."Min. shutter speed", ''), ' sec', '')), ''),
  nullif(trim(replace(coalesce(i."Max. shutter speed", ''), ' sec', '')), ''),

  -- ลบ zero-width space ที่ติดมากับค่าวิดีโอบางแถว
  nullif(trim(replace(coalesce(i."Max. video resolution", ''), E'​', '')), ''),

  nullif(concat_ws(' ',
    nullif(trim(coalesce(i."Screen size", '')), ''),
    case when trim(coalesce(i."Screen resolution", '')) <> ''
         then '(' || trim(i."Screen resolution") || ')' end), ''),

  nullif(trim(coalesce(i."Viewfinder", '')), ''),

  nullif(regexp_replace(coalesce(i."Weight", ''), '[^0-9].*$', '', 'g'), '')::numeric::int,
  nullif(trim(replace(coalesce(i."Dimensions", ''), ' mm', '')), '')

from camera_import i
join products p on p.slug = public.slugify(i."Brand" || '-' || i."Model")
left join lateral (
  select min(t::int) as lo, max(t::int) as hi
  from unnest(string_to_array(
         regexp_replace(split_part(coalesce(i."ISO", ''), '(', 1), '[^0-9]+', ' ', 'g'),
         ' ')) as t
  where t ~ '^\d+$'
) iso on true
on conflict (product_id) do nothing;

-- ---------------------------------------------------------------------
-- 4. ตรวจผล
-- ---------------------------------------------------------------------
select
  (select count(*) from companies)                                   as "แบรนด์",
  (select count(*) from products where product_type = 'camera')      as "กล้อง",
  (select count(*) from camera_specs)                                as "แถวสเปก",
  (select count(*) from products where thumbnail_url is not null)    as "มีรูป",
  (select count(*) from camera_specs where iso_max is not null)      as "มี ISO";

-- ตัวอย่างที่นำเข้ามา
select p.name, p.release_year, p.status, s.sensor_type, s.megapixels, s.iso_min, s.iso_max
from products p
join camera_specs s on s.product_id = p.id
order by p.release_year desc nulls last, p.name
limit 10;

-- เมื่อพอใจกับผลแล้ว ลบตารางพักทิ้งได้
-- drop table camera_import;
