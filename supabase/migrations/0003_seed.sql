-- =====================================================================
-- Shopcam — Seed data (แคตตาล็อกอย่างเดียว ไม่พึ่ง auth.users)
-- ถ้าอยาก seed listing/review ต้องสมัครผู้ใช้ก่อน แล้วค่อยรัน 0004 (ยังไม่มี)
-- รันซ้ำได้ (idempotent)
-- =====================================================================

insert into companies (name, slug, country, founded_year) values
  ('Sony',     'sony',     'Japan', 1946),
  ('Canon',    'canon',    'Japan', 1937),
  ('Nikon',    'nikon',    'Japan', 1917),
  ('Fujifilm', 'fujifilm', 'Japan', 1934),
  ('Olympus',  'olympus',  'Japan', 1919),
  ('Panasonic','panasonic','Japan', 1918),
  ('Sigma',    'sigma',    'Japan', 1961),
  ('Manfrotto','manfrotto','Italy', 1972),
  ('Peak Design','peak-design','USA', 2010)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- กล้อง
-- ---------------------------------------------------------------------
insert into products (slug, product_no, name, product_type, company_id, announced_date, status, msrp, market_price, summary, best_for, highlight, thumbnail_url)
select v.slug, v.product_no, v.name, 'camera'::product_type, c.id, v.announced::date, v.status::production_status,
       v.msrp, v.market_price, v.summary, v.best_for, v.highlight, v.thumb
from (values
  ('sony-a7c-ii','SNY-A7C2','Sony A7C II','sony','2023-08-29','in_production',79900,68000,
   'ฟูลเฟรมตัวเล็ก น้ำหนักเบา AF แม่นมาก เหมาะกับสายพกพาและวิดีโอ',
   array['travel','portrait','vlog'], array['Full Frame ในบอดี้เล็ก','IBIS 7 stop','AI AF ตรวจจับคน/สัตว์'],
   'https://placehold.co/600x400/1a1a20/F5A623?text=A7C+II'),
  ('sony-a6700','SNY-A6700','Sony A6700','sony','2023-07-12','in_production',54900,46000,
   'APS-C เรือธง ตัวคุ้มสำหรับสายวิดีโอที่ยังอยากได้ภาพนิ่งดี ๆ',
   array['vlog','sport','travel'], array['APS-C 26MP','4K 120p','จับโฟกัสไว'],
   'https://placehold.co/600x400/1a1a20/F5A623?text=A6700'),
  ('canon-eos-r6-ii','CAN-R6M2','Canon EOS R6 Mark II','canon','2022-11-02','in_production',89900,72000,
   'ตัวกลางฟูลเฟรมของ Canon ถ่ายต่อเนื่อง 40 fps เหมาะกับงานอีเวนต์และกีฬา',
   array['sport','wedding','portrait'], array['40 fps ไฟฟ้า','Dual Pixel AF II','บอดี้กันละอองน้ำ'],
   'https://placehold.co/600x400/1a1a20/F5A623?text=R6+II'),
  ('canon-eos-r50','CAN-R50','Canon EOS R50','canon','2023-02-08','in_production',26900,21000,
   'มิเรอร์เลสตัวเริ่มต้น เบามาก ใช้ง่าย เหมาะกับมือใหม่และคอนเทนต์',
   array['beginner','vlog','travel'], array['น้ำหนัก 375 กรัม','โหมดออโต้ฉลาด','ราคาเข้าถึงง่าย'],
   'https://placehold.co/600x400/1a1a20/F5A623?text=R50'),
  ('nikon-z6-iii','NKN-Z6M3','Nikon Z6 III','nikon','2024-06-17','in_production',89900,79000,
   'เซนเซอร์ partially stacked ตัวแรกของโลก จุดเด่นคือวิดีโอ RAW ในตัว',
   array['video','sport','night'], array['Partially stacked sensor','N-RAW ในตัว','EVF สว่าง 4000 nits'],
   'https://placehold.co/600x400/1a1a20/F5A623?text=Z6+III'),
  ('fujifilm-x-t5','FJI-XT5','Fujifilm X-T5','fujifilm','2022-11-02','in_production',62900,52000,
   'APS-C 40MP ดีไซน์ปุ่มหมุนคลาสสิก ฟิล์มซิมูเลชันเป็นจุดขาย',
   array['street','portrait','travel'], array['40MP APS-C','Film Simulation 19 แบบ','ปุ่มหมุนแมนนวล'],
   'https://placehold.co/600x400/1a1a20/F5A623?text=X-T5'),
  ('fujifilm-x100vi','FJI-X100VI','Fujifilm X100VI','fujifilm','2024-02-20','in_production',56900,62000,
   'คอมแพ็กต์เลนส์ฟิกซ์ 35mm ยอดฮิตสายสตรีท ของขาดตลาดจนราคามือสองแพงกว่าป้าย',
   array['street','travel','daily'], array['เลนส์ฟิกซ์ 23mm f/2','IBIS ครั้งแรกในซีรีส์','ไวไฟน์เดอร์ไฮบริด'],
   'https://placehold.co/600x400/1a1a20/F5A623?text=X100VI'),
  ('olympus-om-1','OLY-OM1','OM System OM-1','olympus','2022-02-15','in_production',79900,49000,
   'MFT บอดี้ทนสภาพอากาศระดับ IP53 เหมาะสายเดินป่า ถ่ายนก',
   array['wildlife','landscape','travel'], array['กันน้ำ IP53','50 fps AF/AE ต่อเนื่อง','Live ND ในตัว'],
   'https://placehold.co/600x400/1a1a20/F5A623?text=OM-1'),
  ('panasonic-g100','PAN-G100','Panasonic Lumix G100','panasonic','2020-06-24','discontinued',22900,12000,
   'กล้อง vlog ตัวเล็ก มีไมค์ OZO 3 ทิศทางในตัว เลิกผลิตแล้วแต่มือสองคุ้ม',
   array['vlog','beginner'], array['ไมค์ OZO ในตัว','จอพลิกได้','เลิกผลิตแล้ว ราคามือสองถูก'],
   'https://placehold.co/600x400/1a1a20/F5A623?text=G100')
) as v(slug, product_no, name, brand, announced, status, msrp, market_price, summary, best_for, highlight, thumb)
join companies c on c.slug = v.brand
on conflict (slug) do nothing;

insert into camera_specs (product_id, body_type, sensor_size, sensor_type, megapixels, max_resolution,
                          iso_min, iso_max, shutter_min, shutter_max, fps_burst, video_max,
                          ibis, weather_sealed, screen_type, viewfinder, battery_shots, weight_g, dimensions_mm)
select p.id, v.body_type, v.sensor_size, v.sensor_type, v.mp, v.max_res, v.iso_min, v.iso_max,
       v.sh_min, v.sh_max, v.fps, v.video, v.ibis, v.sealed, v.screen, v.evf, v.shots, v.weight, v.dim
from (values
  ('sony-a7c-ii',     'Compact',      'Full Frame','BSI-CMOS', 33.0,'7008 x 4672',100,51200,'30s','1/4000',10.0,'4K 60p',  true,  true, 'จอพลิก 3.0" ทัชสกรีน','OLED 2.36M dot',  530, 514,'124 x 71 x 63'),
  ('sony-a6700',      'Compact',      'APS-C',     'BSI-CMOS', 26.0,'6192 x 4128',100,32000,'30s','1/4000',11.0,'4K 120p', true,  true, 'จอพลิก 3.0" ทัชสกรีน','OLED 2.36M dot',  570, 493,'122 x 69 x 75'),
  ('canon-eos-r6-ii', 'SLR-style',    'Full Frame','CMOS',     24.2,'6000 x 4000',100,102400,'30s','1/8000',40.0,'4K 60p', true,  true, 'จอพลิก 3.0" ทัชสกรีน','OLED 3.69M dot',  580, 670,'138 x 98 x 88'),
  ('canon-eos-r50',   'SLR-style',    'APS-C',     'CMOS',     24.2,'6000 x 4000',100,32000,'30s','1/4000',15.0,'4K 30p',  false, false,'จอพลิก 3.0" ทัชสกรีน','OLED 2.36M dot',  370, 375,'116 x 86 x 69'),
  ('nikon-z6-iii',    'SLR-style',    'Full Frame','Partially stacked CMOS',24.5,'6048 x 4032',100,64000,'900s','1/8000',20.0,'6K 60p RAW', true, true,'จอพลิก 3.2" ทัชสกรีน','OLED 5.76M dot', 390, 760,'139 x 102 x 74'),
  ('fujifilm-x-t5',   'SLR-style',    'APS-C',     'BSI-CMOS', 40.2,'7728 x 5152',125,12800,'900s','1/8000',15.0,'6.2K 30p',true, true, 'จอพับ 3 ทาง 3.0"','OLED 3.69M dot',   580, 557,'130 x 91 x 64'),
  ('fujifilm-x100vi', 'Large Sensor Compact','APS-C','BSI-CMOS',40.2,'7728 x 5152',125,12800,'900s','1/4000',11.0,'6.2K 30p',true,false,'จอพลิก 3.0" ทัชสกรีน','Hybrid OVF/EVF',  450, 521,'128 x 74 x 55'),
  ('olympus-om-1',    'SLR-style',    'Four Thirds','Stacked BSI-CMOS',20.4,'5184 x 3888',80,102400,'60s','1/8000',50.0,'4K 60p',true,true,'จอพลิก 3.0" ทัชสกรีน','OLED 5.76M dot',  520, 599,'135 x 92 x 73'),
  ('panasonic-g100',  'SLR-style',    'Four Thirds','CMOS',    20.3,'5184 x 3888',200,25600,'60s','1/4000',10.0,'4K 30p',  false,false,'จอพลิก 3.0" ทัชสกรีน','OLED 3.68M dot',  270, 352,'116 x 83 x 54')
) as v(slug, body_type, sensor_size, sensor_type, mp, max_res, iso_min, iso_max, sh_min, sh_max, fps, video, ibis, sealed, screen, evf, shots, weight, dim)
join products p on p.slug = v.slug
on conflict (product_id) do nothing;

-- ---------------------------------------------------------------------
-- เลนส์
-- ---------------------------------------------------------------------
insert into products (slug, product_no, name, product_type, company_id, announced_date, status, msrp, market_price, summary, best_for, highlight, thumbnail_url)
select v.slug, v.product_no, v.name, 'lens'::product_type, c.id, v.announced::date, 'in_production'::production_status,
       v.msrp, v.market_price, v.summary, v.best_for, v.highlight, v.thumb
from (values
  ('sony-fe-50mm-f18','SNY-FE5018','Sony FE 50mm F1.8','sony','2016-03-29',8990,6000,
   'เลนส์ฟิกซ์ราคาประหยัด ละลายหลังได้ดี เหมาะเป็นเลนส์ตัวที่สอง',
   array['portrait','daily'], array['ราคาถูกที่สุดในกลุ่มฟิกซ์ FE','เบา 186 กรัม'],
   'https://placehold.co/600x400/1a1a20/F5A623?text=FE+50mm'),
  ('sigma-18-50-f28','SGM-1850DC','Sigma 18-50mm F2.8 DC DN','sigma','2021-10-06',19900,15500,
   'ซูมรูรับแสงคงที่ f/2.8 สำหรับ APS-C เล็กและเบาผิดปกติ',
   array['travel','event','daily'], array['f/2.8 ตลอดช่วง','เล็กกว่าคู่แข่งครึ่งหนึ่ง'],
   'https://placehold.co/600x400/1a1a20/F5A623?text=18-50mm'),
  ('canon-rf-50mm-f18','CAN-RF5018','Canon RF 50mm F1.8 STM','canon','2020-11-04',7490,5200,
   'นิฟตี้ฟิฟตี้ของระบบ RF คุ้มที่สุดสำหรับมือใหม่',
   array['portrait','beginner'], array['ราคาเบา','STM เงียบ เหมาะถ่ายวิดีโอ'],
   'https://placehold.co/600x400/1a1a20/F5A623?text=RF+50mm')
) as v(slug, product_no, name, brand, announced, msrp, market_price, summary, best_for, highlight, thumb)
join companies c on c.slug = v.brand
on conflict (slug) do nothing;

insert into lens_specs (product_id, focal_min_mm, focal_max_mm, aperture_max, aperture_min, mount, is_prime, stabilization, filter_thread_mm, min_focus_cm, weight_g)
select p.id, v.fmin, v.fmax, v.amax, v.amin, v.mount, v.prime, v.ois, v.thread, v.mfd, v.weight
from (values
  ('sony-fe-50mm-f18',  50.0, 50.0, 1.8, 22.0, 'Sony E', true,  false, 49, 45.0, 186),
  ('sigma-18-50-f28',   18.0, 50.0, 2.8, 22.0, 'Sony E / Fuji X', false, false, 55, 12.1, 290),
  ('canon-rf-50mm-f18', 50.0, 50.0, 1.8, 22.0, 'Canon RF', true, false, 43, 30.0, 160)
) as v(slug, fmin, fmax, amax, amin, mount, prime, ois, thread, mfd, weight)
join products p on p.slug = v.slug
on conflict (product_id) do nothing;

-- ---------------------------------------------------------------------
-- อุปกรณ์เสริม
-- ---------------------------------------------------------------------
insert into products (slug, product_no, name, product_type, company_id, announced_date, status, msrp, market_price, summary, highlight, thumbnail_url)
select v.slug, v.product_no, v.name, v.ptype::product_type, c.id, v.announced::date, 'in_production'::production_status,
       v.msrp, v.market_price, v.summary, v.highlight, v.thumb
from (values
  ('manfrotto-befree-3','MNF-BF3','Manfrotto Befree Advanced','manfrotto','tripod','2018-09-01',9900,6500,
   'ขาตั้งพับพกพา อลูมิเนียม พับสั้น 40 ซม. ใส่กระเป๋าเป้ได้',
   array['พับสั้น 40 ซม.','รับน้ำหนัก 8 กก.'],
   'https://placehold.co/600x400/1a1a20/F5A623?text=Befree'),
  ('peak-design-slide','PKD-SLIDE','Peak Design Slide','peak-design','strap',' 2015-01-01',2790,1900,
   'สายคล้องกล้องปรับความยาวไวด้วยมือเดียว ถอดเปลี่ยนได้',
   array['ปรับความยาวมือเดียว','Anchor Link ถอดไว'],
   'https://placehold.co/600x400/1a1a20/F5A623?text=Slide')
) as v(slug, product_no, name, brand, ptype, announced, msrp, market_price, summary, highlight, thumb)
join companies c on c.slug = v.brand
on conflict (slug) do nothing;

insert into tripod_specs (product_id, material, max_height_cm, min_height_cm, folded_length_cm, load_capacity_kg, leg_sections, head_type, weight_g)
select p.id, 'Aluminium', 150.0, 40.0, 40.0, 8.0, 4, 'Ball head', 1550
from products p where p.slug = 'manfrotto-befree-3'
on conflict (product_id) do nothing;

insert into strap_specs (product_id, material, length_cm, attachment_type, quick_release)
select p.id, 'Seatbelt webbing', 145.0, 'Anchor Link', true
from products p where p.slug = 'peak-design-slide'
on conflict (product_id) do nothing;

-- ---------------------------------------------------------------------
-- ความเข้ากันได้ (กล้อง <-> เลนส์)
-- ---------------------------------------------------------------------
insert into product_compatibility (product_id, compatible_with, note)
select cam.id, lens.id, 'เมาท์ตรงกัน'
from products cam, products lens
where (cam.slug, lens.slug) in (
  ('sony-a7c-ii','sony-fe-50mm-f18'),
  ('sony-a6700','sony-fe-50mm-f18'),
  ('sony-a6700','sigma-18-50-f28'),
  ('canon-eos-r6-ii','canon-rf-50mm-f18'),
  ('canon-eos-r50','canon-rf-50mm-f18'),
  ('fujifilm-x-t5','sigma-18-50-f28')
)
on conflict do nothing;

-- ---------------------------------------------------------------------
-- รูปสินค้าเพิ่มเติม (placeholder — เปลี่ยนเป็น Supabase Storage ทีหลัง)
-- ---------------------------------------------------------------------
insert into product_images (product_id, url, alt, sort_order)
select p.id, p.thumbnail_url, p.name, 0
from products p
where p.thumbnail_url is not null
  and not exists (select 1 from product_images i where i.product_id = p.id);
