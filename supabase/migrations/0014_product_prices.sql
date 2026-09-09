-- =====================================================================
-- ราคาสินค้าพร้อมแหล่งอ้างอิง
--
-- ชุดข้อมูลที่นำเข้ามาไม่มีราคา ไฟล์นี้จึงเปิดช่องให้เติมราคาทีละรุ่น
-- โดยบังคับว่าทุกราคาต้องมี URL แหล่งที่มากำกับ
--
-- ทำไมต้องเก็บแหล่งที่มาในฐานข้อมูล ไม่ใช่แค่จำไว้เฉย ๆ:
--   1) ตรวจสอบย้อนหลังได้ว่าราคานี้มาจากไหน ณ วันไหน
--   2) ราคาเปลี่ยนตลอด เก็บวันที่ไว้จะรู้ว่าข้อมูลเก่าแค่ไหน
--   3) ถ้าถูกถามว่า "รู้ได้ไงว่าราคานี้" มีคำตอบให้เปิดดูได้ทันที
--
-- วิธีเพิ่มรุ่นใหม่: เพิ่มบรรทัดใน values แล้วรันไฟล์นี้ซ้ำ — รันซ้ำได้ปลอดภัย
-- =====================================================================

alter table products add column if not exists price_source_url text;
alter table products add column if not exists price_checked_at date;

comment on column products.price_source_url is
  'URL ที่ใช้อ้างอิงราคา — ต้องเป็นหน้าที่เปิดดูได้จริง ไม่ใช่ที่เดาขึ้นมา';
comment on column products.price_checked_at is
  'วันที่ตรวจสอบราคาครั้งล่าสุด ราคากล้องเปลี่ยนบ่อย ข้อมูลเก่าอาจไม่ตรงแล้ว';

-- ---------------------------------------------------------------------
-- ราคาที่เก็บมาแล้ว
--
-- คอลัมน์ verified บอกว่าตรวจสอบระดับไหน:
--   'opened'  = เปิดหน้าเว็บอ่านเองแล้ว เห็นตัวเลขกับตา
--   'listed'  = เห็นจากผลค้นหา ยังไม่ได้เปิดหน้าจริง — ควรกดยืนยันก่อนใช้จริง
-- แถวที่เป็น 'listed' ให้เปิดลิงก์เช็คแล้วเปลี่ยนเป็น 'opened' เมื่อยืนยันแล้ว
-- ---------------------------------------------------------------------
update products p
set msrp            = v.price,
    price_source_url = v.source,
    price_checked_at = v.checked::date
from (values
  ('sony-a7c-ii',     75990, 'https://www.beartai.com/tech/camera/1307581/',        '2026-09-10', 'opened'),
  ('nikon-z6-iii',    94900, 'https://www.digital2home.com/product/nikon-z6-iii-0/', '2026-09-10', 'listed'),
  ('canon-eos-r6-ii', 82990, 'https://life.th.canon/news-activities-detail.html?id=134', '2026-09-10', 'listed')
) as v(slug, price, source, checked, verified)
where p.slug = v.slug;

-- ---------------------------------------------------------------------
-- ตรวจผล
-- ---------------------------------------------------------------------
select name, msrp, price_checked_at, price_source_url
from products
where price_source_url is not null
order by name;

-- นับว่ายังขาดราคาอีกกี่รุ่น
select count(*) filter (where msrp is null)          as "ยังไม่มีราคา",
       count(*) filter (where price_source_url is not null) as "มีแหล่งอ้างอิง"
from products where is_deleted = false;
