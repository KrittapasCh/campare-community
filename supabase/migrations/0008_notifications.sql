-- =====================================================================
-- ระบบแจ้งเตือน (Functional Requirement ข้อ 9)
--
-- ทำไมทำเป็น trigger ใน DB แทนที่จะเขียนในโค้ดแอป:
--
-- 1. RLS ของ notifications บังคับว่า user_id = auth.uid()
--    แปลว่าผู้ใช้ A "แทรกแถวแจ้งเตือนให้ผู้ใช้ B" ไม่ได้
--    ต้องใช้ฟังก์ชัน SECURITY DEFINER ซึ่งรันด้วยสิทธิ์เจ้าของฟังก์ชัน
--
-- 2. ถ้าเขียนในแอป แล้ววันหลังมีคนเพิ่มข้อมูลผ่าน SQL Editor หรือ
--    ผ่านหน้า admin คนละทาง การแจ้งเตือนจะหลุด
--    ทำที่ DB = ไม่ว่าข้อมูลเข้ามาทางไหนก็แจ้งเตือนเสมอ
-- =====================================================================

-- ---------------------------------------------------------------------
-- ฟังก์ชันกลางสำหรับสร้างการแจ้งเตือน
-- ---------------------------------------------------------------------
create or replace function public.create_notification(
  p_user_id uuid,
  p_type    notification_type,
  p_title   text,
  p_body    text default null,
  p_link    text default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  -- ไม่แจ้งเตือนถ้าไม่มีผู้รับ หรือผู้รับถูกระงับบัญชีไปแล้ว
  if p_user_id is null then
    return;
  end if;

  if not exists (
    select 1 from profiles where id = p_user_id and is_deleted = false
  ) then
    return;
  end if;

  insert into notifications (user_id, type, title, body, link)
  values (p_user_id, p_type, p_title, left(p_body, 300), p_link);
end;
$$;

-- ---------------------------------------------------------------------
-- 1. มีคนตอบกระทู้ / คอมเมนต์ใต้ภาพ
-- ---------------------------------------------------------------------
create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  owner_id uuid;
  ref_title text;
begin
  if new.target_type = 'post' then
    select author_id, title into owner_id, ref_title
    from community_posts where id = new.target_id;

    if owner_id is not null and owner_id <> new.author_id then
      perform public.create_notification(
        owner_id,
        'question_answered',
        'มีคนตอบกระทู้ของคุณ',
        ref_title,
        '/community/' || new.target_id
      );
    end if;

  elsif new.target_type = 'photo' then
    select author_id, coalesce(title, 'ภาพตัวอย่าง') into owner_id, ref_title
    from gallery_photos where id = new.target_id;

    if owner_id is not null and owner_id <> new.author_id then
      perform public.create_notification(
        owner_id,
        'question_answered',
        'มีคนแสดงความคิดเห็นใต้ภาพของคุณ',
        ref_title,
        '/gallery/' || new.target_id
      );
    end if;
  end if;

  return null;
end;
$$;

drop trigger if exists comments_notify on comments;
create trigger comments_notify
  after insert on comments
  for each row execute function public.notify_on_comment();

-- ---------------------------------------------------------------------
-- 2. มีประกาศขายใหม่ตรงกับรุ่นที่อยู่ใน wishlist
--    เคารพ target_price (ถ้าตั้งไว้ จะเตือนเฉพาะตอนราคาถึงเป้า)
-- ---------------------------------------------------------------------
create or replace function public.notify_wishlist_new_listing()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  rec record;
  product_name text;
begin
  if new.status <> 'active' or new.is_deleted then
    return null;
  end if;

  select name into product_name from products where id = new.product_id;

  for rec in
    select distinct w.user_id, wi.target_price
    from wishlist_items wi
    join wishlists w on w.id = wi.wishlist_id
    where wi.product_id = new.product_id
      and wi.notify = true
      and w.user_id <> new.seller_id            -- ไม่เตือนคนลงประกาศเอง
      and (wi.target_price is null or new.price <= wi.target_price)
  loop
    perform public.create_notification(
      rec.user_id,
      'wishlist_available',
      'มีของเข้า: ' || coalesce(product_name, 'รุ่นที่คุณสนใจ'),
      new.title || ' — ' || to_char(new.price, 'FM999,999,999') || ' บาท',
      '/product/' || (select slug from products where id = new.product_id)
    );
  end loop;

  return null;
end;
$$;

drop trigger if exists listings_notify_wishlist on listings;
create trigger listings_notify_wishlist
  after insert on listings
  for each row execute function public.notify_wishlist_new_listing();

-- ---------------------------------------------------------------------
-- 3. มีรีวิวใหม่ของรุ่นที่อยู่ใน wishlist
-- ---------------------------------------------------------------------
create or replace function public.notify_wishlist_new_review()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  rec record;
  product_name text;
  product_slug text;
begin
  if new.status <> 'approved' or new.is_deleted then
    return null;
  end if;

  select name, slug into product_name, product_slug
  from products where id = new.product_id;

  for rec in
    select distinct w.user_id
    from wishlist_items wi
    join wishlists w on w.id = wi.wishlist_id
    where wi.product_id = new.product_id
      and wi.notify = true
      and w.user_id <> new.author_id
  loop
    perform public.create_notification(
      rec.user_id,
      'new_review',
      'มีรีวิวใหม่ของ ' || coalesce(product_name, 'รุ่นที่คุณสนใจ'),
      coalesce(new.title, left(new.body, 100)),
      '/product/' || product_slug
    );
  end loop;

  return null;
end;
$$;

drop trigger if exists reviews_notify_wishlist on reviews;
create trigger reviews_notify_wishlist
  after insert on reviews
  for each row execute function public.notify_wishlist_new_review();

-- ---------------------------------------------------------------------
-- 4. ผลการอนุมัติเนื้อหาจากผู้ดูแล
-- ---------------------------------------------------------------------
create or replace function public.notify_moderation_result()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  label text;
  link  text;
  ref_title text;
begin
  if new.status = old.status then
    return null;
  end if;

  if tg_table_name = 'gallery_photos' then
    label := 'ภาพในแกลเลอรี';
    link  := '/gallery/' || new.id;
    ref_title := coalesce(new.title, 'ภาพตัวอย่าง');
  else
    label := 'กระทู้';
    link  := '/community/' || new.id;
    ref_title := new.title;
  end if;

  if new.status = 'approved' then
    perform public.create_notification(
      new.author_id, 'moderation',
      label || 'ของคุณได้รับการอนุมัติแล้ว', ref_title, link
    );
  elsif new.status = 'rejected' then
    perform public.create_notification(
      new.author_id, 'moderation',
      label || 'ของคุณไม่ผ่านการตรวจสอบ', ref_title, null
    );
  end if;

  return null;
end;
$$;

drop trigger if exists gallery_notify_moderation on gallery_photos;
create trigger gallery_notify_moderation
  after update of status on gallery_photos
  for each row execute function public.notify_moderation_result();

drop trigger if exists posts_notify_moderation on community_posts;
create trigger posts_notify_moderation
  after update of status on community_posts
  for each row execute function public.notify_moderation_result();

-- ---------------------------------------------------------------------
-- 5. ผู้ขายได้รับแจ้งเมื่อมีคนสั่งซื้อ
-- ---------------------------------------------------------------------
create or replace function public.notify_seller_on_order()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  seller uuid;
  order_no_text text;
begin
  select seller_id into seller from listings where id = new.listing_id;
  select order_no into order_no_text from orders where id = new.order_id;

  if seller is not null then
    perform public.create_notification(
      seller,
      'order_update',
      'มีคนสั่งซื้อสินค้าของคุณ',
      new.product_name || ' × ' || new.quantity || ' (คำสั่งซื้อ ' || coalesce(order_no_text, '-') || ')',
      '/profile?tab=selling'
    );
  end if;

  return null;
end;
$$;

drop trigger if exists order_items_notify_seller on order_items;
create trigger order_items_notify_seller
  after insert on order_items
  for each row execute function public.notify_seller_on_order();
