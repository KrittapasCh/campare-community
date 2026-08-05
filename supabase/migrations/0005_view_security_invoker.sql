-- =====================================================================
-- แก้คำเตือน security linter: "Security Definer View"
--
-- โดยดีฟอลต์ view ใน Postgres จะรันด้วยสิทธิ์ของ "คนสร้าง view"
-- ทำให้ RLS ของตารางที่อยู่ข้างในถูกข้าม
--
-- security_invoker = on บอกให้ view รันด้วยสิทธิ์ของ "คนเรียก" แทน
-- (ต้องใช้ PostgreSQL 15 ขึ้นไป — Supabase ใหม่ ๆ เป็น 15/17 อยู่แล้ว)
-- =====================================================================

drop view if exists public.product_market_price;

create view public.product_market_price
with (security_invoker = on)
as
select
  p.id as product_id,
  count(l.id)                       as active_listings,
  min(l.price)                      as min_price,
  max(l.price)                      as max_price,
  round(avg(l.price)::numeric, 2)   as avg_price,
  percentile_cont(0.5) within group (order by l.price) as median_price
from public.products p
left join public.listings l
  on l.product_id = p.id
 and l.status = 'active'
 and l.is_deleted = false
group by p.id;

comment on view public.product_market_price is
  'ราคากลางมือสองต่อรุ่น คำนวณจากประกาศที่ยัง active — ใช้สิทธิ์ของผู้เรียก (security_invoker)';
