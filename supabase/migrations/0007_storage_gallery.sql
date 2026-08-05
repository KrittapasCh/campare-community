-- =====================================================================
-- Supabase Storage สำหรับแกลเลอรีภาพตัวอย่าง
--
-- โครงพาธที่ใช้:  gallery/<user_id>/<timestamp>-<ชื่อไฟล์>
-- การจัดพาธแบบนี้ทำให้เขียน policy ได้ง่าย — เช็คว่าโฟลเดอร์ชั้นแรก
-- ตรงกับ auth.uid() หรือเปล่า ผู้ใช้จึงเขียนได้แค่โฟลเดอร์ของตัวเอง
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gallery',
  'gallery',
  true,                                  -- อ่านได้สาธารณะ (รูปที่อนุมัติแล้วต้องให้คนทั่วไปเห็น)
  10485760,                              -- จำกัด 10 MB ต่อไฟล์
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ล้าง policy เดิมก่อน เผื่อรันซ้ำ
drop policy if exists "gallery public read"      on storage.objects;
drop policy if exists "gallery user upload"      on storage.objects;
drop policy if exists "gallery owner update"     on storage.objects;
drop policy if exists "gallery owner delete"     on storage.objects;

-- ใครก็ดูได้
create policy "gallery public read"
  on storage.objects for select
  using (bucket_id = 'gallery');

-- อัปโหลดได้เฉพาะผู้ที่ล็อกอิน และต้องลงในโฟลเดอร์ชื่อ = user id ของตัวเอง
create policy "gallery user upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'gallery'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "gallery owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'gallery'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "gallery owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'gallery'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
