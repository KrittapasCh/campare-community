-- =====================================================================
-- Shopcam — Row Level Security
-- หลักการ: ข้อมูลแคตตาล็อกสินค้า = อ่านได้ทุกคน / แก้ได้เฉพาะ admin
--          ข้อมูลส่วนตัว (ตะกร้า, wishlist, order, noti) = เจ้าของเท่านั้น
-- =====================================================================

-- helper: เช็คว่าผู้ใช้ปัจจุบันเป็น admin ไหม
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin' and is_deleted = false
  );
$$;

alter table profiles              enable row level security;
alter table companies             enable row level security;
alter table products              enable row level security;
alter table camera_specs          enable row level security;
alter table lens_specs            enable row level security;
alter table tripod_specs          enable row level security;
alter table filter_specs          enable row level security;
alter table strap_specs           enable row level security;
alter table grip_specs            enable row level security;
alter table product_compatibility enable row level security;
alter table product_images        enable row level security;
alter table listings              enable row level security;
alter table listing_images        enable row level security;
alter table carts                 enable row level security;
alter table cart_items            enable row level security;
alter table orders                enable row level security;
alter table order_items           enable row level security;
alter table wishlists             enable row level security;
alter table wishlist_items        enable row level security;
alter table reviews               enable row level security;
alter table gallery_photos        enable row level security;
alter table community_posts       enable row level security;
alter table comments              enable row level security;
alter table follows               enable row level security;
alter table compare_sets          enable row level security;
alter table compare_items         enable row level security;
alter table notifications         enable row level security;
alter table search_history        enable row level security;
alter table reports               enable row level security;

-- ---------- PROFILES ----------
create policy "profiles readable by everyone"
  on profiles for select using (is_deleted = false);
create policy "user updates own profile"
  on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "admin manages profiles"
  on profiles for all using (public.is_admin()) with check (public.is_admin());

-- ---------- CATALOG (อ่านสาธารณะ, เขียนเฉพาะ admin) ----------
do $$
declare t text;
begin
  foreach t in array array[
    'companies','products','camera_specs','lens_specs','tripod_specs',
    'filter_specs','strap_specs','grip_specs','product_compatibility','product_images'
  ]
  loop
    execute format('create policy "%1$s public read" on %1$I for select using (true);', t);
    execute format('create policy "%1$s admin write" on %1$I for all using (public.is_admin()) with check (public.is_admin());', t);
  end loop;
end $$;

-- ---------- LISTINGS ----------
create policy "active listings public"
  on listings for select
  using (status = 'active' and is_deleted = false or seller_id = auth.uid() or public.is_admin());
create policy "seller creates listing"
  on listings for insert with check (seller_id = auth.uid());
create policy "seller edits own listing"
  on listings for update using (seller_id = auth.uid() or public.is_admin())
  with check (seller_id = auth.uid() or public.is_admin());

create policy "listing images public read" on listing_images for select using (true);
create policy "seller manages listing images"
  on listing_images for all
  using (exists (select 1 from listings l where l.id = listing_id and (l.seller_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from listings l where l.id = listing_id and (l.seller_id = auth.uid() or public.is_admin())));

-- ---------- CART ----------
create policy "own cart" on carts for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own cart items" on cart_items for all
  using (exists (select 1 from carts c where c.id = cart_id and c.user_id = auth.uid()))
  with check (exists (select 1 from carts c where c.id = cart_id and c.user_id = auth.uid()));

-- ---------- ORDERS ----------
create policy "buyer reads own orders"
  on orders for select using (buyer_id = auth.uid() or public.is_admin());
create policy "buyer creates order"
  on orders for insert with check (buyer_id = auth.uid());
create policy "admin updates orders"
  on orders for update using (public.is_admin() or buyer_id = auth.uid())
  with check (public.is_admin() or buyer_id = auth.uid());
create policy "order items follow order"
  on order_items for all
  using (exists (select 1 from orders o where o.id = order_id and (o.buyer_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from orders o where o.id = order_id and o.buyer_id = auth.uid()));

-- ---------- WISHLIST ----------
create policy "own wishlist" on wishlists for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own wishlist items" on wishlist_items for all
  using (exists (select 1 from wishlists w where w.id = wishlist_id and w.user_id = auth.uid()))
  with check (exists (select 1 from wishlists w where w.id = wishlist_id and w.user_id = auth.uid()));

-- ---------- REVIEWS ----------
create policy "approved reviews public"
  on reviews for select
  using ((status = 'approved' and is_deleted = false) or author_id = auth.uid() or public.is_admin());
create policy "user writes own review"
  on reviews for insert with check (author_id = auth.uid());
create policy "user edits own review"
  on reviews for update using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

-- ---------- GALLERY ----------
create policy "approved photos public"
  on gallery_photos for select
  using ((status = 'approved' and is_deleted = false) or author_id = auth.uid() or public.is_admin());
create policy "user uploads photo"
  on gallery_photos for insert with check (author_id = auth.uid());
create policy "author or admin edits photo"
  on gallery_photos for update using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

-- ---------- COMMUNITY ----------
create policy "approved posts public"
  on community_posts for select
  using ((status = 'approved' and is_deleted = false) or author_id = auth.uid() or public.is_admin());
create policy "user creates post"
  on community_posts for insert with check (author_id = auth.uid());
create policy "author or admin edits post"
  on community_posts for update using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

create policy "comments public read"
  on comments for select using (is_deleted = false or public.is_admin());
create policy "user creates comment"
  on comments for insert with check (author_id = auth.uid());
create policy "author or admin edits comment"
  on comments for update using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

create policy "follows public read" on follows for select using (true);
create policy "user manages own follows" on follows for all
  using (follower_id = auth.uid()) with check (follower_id = auth.uid());

-- ---------- COMPARE ----------
create policy "own or anonymous compare set" on compare_sets for all
  using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid() or user_id is null);
create policy "compare items follow set" on compare_items for all
  using (exists (select 1 from compare_sets s where s.id = compare_set_id and (s.user_id = auth.uid() or s.user_id is null)))
  with check (exists (select 1 from compare_sets s where s.id = compare_set_id and (s.user_id = auth.uid() or s.user_id is null)));

-- ---------- NOTIFICATION / SEARCH ----------
create policy "own notifications" on notifications for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own search history" on search_history for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- REPORTS ----------
create policy "reporter or admin reads report"
  on reports for select using (reporter_id = auth.uid() or public.is_admin());
create policy "user files report"
  on reports for insert with check (reporter_id = auth.uid());
create policy "admin handles report"
  on reports for update using (public.is_admin()) with check (public.is_admin());
