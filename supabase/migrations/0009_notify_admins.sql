-- =====================================================================
-- แจ้งเตือนผู้ดูแลเมื่อมีของเข้าคิวรอตรวจสอบ
--
-- เดิมการแจ้งเตือนวิ่งไปหาเจ้าของเนื้อหาอย่างเดียว ผู้ดูแลต้องคอยเข้า
-- /admin/moderation เช็คเองว่ามีอะไรค้าง ซึ่งของจะค้างคิวนานโดยไม่มีใครรู้
-- =====================================================================

-- ---------------------------------------------------------------------
-- ฟังก์ชันกลาง: ส่งแจ้งเตือนหาผู้ดูแลทุกคน (ข้ามคนที่เป็นต้นเรื่องเอง)
-- ---------------------------------------------------------------------
create or replace function public.notify_admins(
  p_title   text,
  p_body    text,
  p_link    text,
  p_exclude uuid default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  admin_row record;
begin
  for admin_row in
    select id from profiles
    where role = 'admin'
      and is_deleted = false
      and (p_exclude is null or id <> p_exclude)
  loop
    perform public.create_notification(
      admin_row.id, 'moderation', p_title, p_body, p_link
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- 1. มีรูปใหม่รออนุมัติ
-- ---------------------------------------------------------------------
create or replace function public.notify_admins_new_photo()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  author_name text;
begin
  if new.status <> 'pending' or new.is_deleted then
    return null;
  end if;

  select display_name into author_name from profiles where id = new.author_id;

  perform public.notify_admins(
    'มีรูปใหม่รออนุมัติ',
    coalesce(new.title, 'ภาพตัวอย่าง') || ' — โดย ' || coalesce(author_name, 'ผู้ใช้'),
    '/admin/moderation',
    new.author_id
  );

  return null;
end;
$$;

drop trigger if exists gallery_notify_admins on gallery_photos;
create trigger gallery_notify_admins
  after insert on gallery_photos
  for each row execute function public.notify_admins_new_photo();

-- ---------------------------------------------------------------------
-- 2. มีกระทู้ใหม่รออนุมัติ
-- ---------------------------------------------------------------------
create or replace function public.notify_admins_new_post()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  author_name text;
begin
  if new.status <> 'pending' or new.is_deleted then
    return null;
  end if;

  select display_name into author_name from profiles where id = new.author_id;

  perform public.notify_admins(
    'มีกระทู้ใหม่รออนุมัติ',
    new.title || ' — โดย ' || coalesce(author_name, 'ผู้ใช้'),
    '/admin/moderation?tab=posts',
    new.author_id
  );

  return null;
end;
$$;

drop trigger if exists posts_notify_admins on community_posts;
create trigger posts_notify_admins
  after insert on community_posts
  for each row execute function public.notify_admins_new_post();

-- ---------------------------------------------------------------------
-- 3. มีการรายงานปัญหาเข้ามา
-- ---------------------------------------------------------------------
create or replace function public.notify_admins_new_report()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  reporter_name text;
  target_label  text;
begin
  select display_name into reporter_name from profiles where id = new.reporter_id;

  target_label := case new.target_type
    when 'product' then 'สินค้า'
    when 'listing' then 'ประกาศขาย'
    when 'review'  then 'รีวิว'
    when 'post'    then 'โพสต์'
    when 'comment' then 'คอมเมนต์'
    when 'photo'   then 'รูปภาพ'
    when 'user'    then 'ผู้ใช้'
    else new.target_type::text
  end;

  perform public.notify_admins(
    'มีรายงานปัญหาใหม่',
    target_label || ': ' || new.reason || ' — แจ้งโดย ' || coalesce(reporter_name, 'ผู้ใช้'),
    '/admin/reports',
    new.reporter_id
  );

  return null;
end;
$$;

drop trigger if exists reports_notify_admins on reports;
create trigger reports_notify_admins
  after insert on reports
  for each row execute function public.notify_admins_new_report();

-- ---------------------------------------------------------------------
-- เติมย้อนหลัง: ถ้ามีของค้างคิวอยู่แล้ว แจ้งผู้ดูแลรอบเดียวให้รู้ตัว
-- ---------------------------------------------------------------------
do $$
declare
  n_photos  int;
  n_posts   int;
  n_reports int;
begin
  select count(*) into n_photos  from gallery_photos  where status = 'pending' and is_deleted = false;
  select count(*) into n_posts   from community_posts where status = 'pending' and is_deleted = false;
  select count(*) into n_reports from reports         where status = 'pending';

  if n_photos + n_posts + n_reports > 0 then
    perform public.notify_admins(
      'มีงานค้างรอตรวจสอบ',
      'รูป ' || n_photos || ' · กระทู้ ' || n_posts || ' · รายงาน ' || n_reports,
      '/admin/moderation',
      null
    );
  end if;
end $$;
