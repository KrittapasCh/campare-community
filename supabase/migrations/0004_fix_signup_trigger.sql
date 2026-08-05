-- =====================================================================
-- แก้บั๊ก: สมัครสมาชิกแล้วขึ้น "Database error saving new user"
--
-- สาเหตุ: profiles.username เป็น unique ถ้าสองคนใช้อีเมลคนละโดเมน
-- แต่ส่วนหน้า @ เหมือนกัน (krit@gmail.com / krit@hotmail.com)
-- จะได้ username ซ้ำ -> trigger throw -> Supabase ยกเลิกการสมัครทั้งก้อน
--
-- ทางแก้: หา username ที่ว่างให้อัตโนมัติ (krit, krit2, krit3, ...)
-- และถ้า trigger พังด้วยเหตุอื่น ก็ไม่ให้ล้มการสมัคร
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_name text;
  candidate text;
  n integer := 1;
begin
  -- ตั้งต้นจาก username ที่ส่งมา ถ้าไม่มีก็ใช้ส่วนหน้า @ ของอีเมล
  base_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'user'
  );

  -- เหลือแต่ a-z 0-9 _ . และตัดให้ไม่ยาวเกิน 24 ตัว
  base_name := lower(regexp_replace(base_name, '[^a-zA-Z0-9_.]', '', 'g'));
  base_name := left(nullif(base_name, ''), 24);
  base_name := coalesce(base_name, 'user');

  candidate := base_name;
  while exists (select 1 from public.profiles where username = candidate) loop
    n := n + 1;
    candidate := base_name || n::text;
  end loop;

  insert into public.profiles (id, username, display_name, email, phone)
  values (
    new.id,
    candidate,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),   -- OAuth Google/Facebook ส่งมาเป็น full_name
      base_name
    ),
    new.email,
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;

  return new;
exception
  when others then
    -- ไม่ให้ profile พังแล้วลากการสมัครล้มไปด้วย
    raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;

-- ให้ trigger ทำงานตอน insert อยู่แล้ว (สร้างไว้ใน 0001) — สร้างซ้ำเผื่อกรณีถูกลบ
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ซ่อมผู้ใช้ที่สมัครไปแล้วแต่ยังไม่มีแถวใน profiles
insert into public.profiles (id, username, display_name, email)
select
  u.id,
  'user_' || left(replace(u.id::text, '-', ''), 8),
  coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1), 'ผู้ใช้'),
  u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
