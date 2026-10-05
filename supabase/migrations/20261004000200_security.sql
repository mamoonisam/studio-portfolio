-- =============================================================================
-- Security: admin check, RPC functions, Row Level Security, grants
-- Safe to run more than once.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- is_admin(): true only for signed-in users listed in admin_users as owner/admin.
-- SECURITY DEFINER so policies can call it without exposing admin_users.
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.user_id = (select auth.uid())
      and a.role in ('owner', 'admin')
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- reorder_items(table, ids): sets display_order = position in the given list.
-- Runs with the caller's rights (RLS still applies) and checks admin explicitly.
-- -----------------------------------------------------------------------------
create or replace function public.reorder_items(p_table text, p_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_table not in ('categories', 'media', 'albums', 'services', 'packages') then
    raise exception 'invalid table' using errcode = '22023';
  end if;

  execute format(
    'update public.%I as t
        set display_order = x.ord
       from unnest($1) with ordinality as x(id, ord)
      where t.id = x.id
        and t.display_order is distinct from x.ord',
    p_table
  ) using p_ids;
end;
$$;

revoke all on function public.reorder_items(text, uuid[]) from public;
grant execute on function public.reorder_items(text, uuid[]) to authenticated;

-- -----------------------------------------------------------------------------
-- set_album_media(album, ids): replaces an album's photos with the given
-- ordered list in one transaction. Clears the cover if it is no longer inside.
-- -----------------------------------------------------------------------------
create or replace function public.set_album_media(p_album_id uuid, p_media_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  delete from public.album_media am
   where am.album_id = p_album_id
     and not (am.media_id = any (coalesce(p_media_ids, '{}')));

  insert into public.album_media (album_id, media_id, position)
  select p_album_id, x.id, x.ord
    from unnest(coalesce(p_media_ids, '{}')) with ordinality as x(id, ord)
    join public.media m on m.id = x.id
  on conflict (album_id, media_id) do update set position = excluded.position;

  update public.albums a
     set cover_media_id = null
   where a.id = p_album_id
     and a.cover_media_id is not null
     and not (a.cover_media_id = any (coalesce(p_media_ids, '{}')));
end;
$$;

revoke all on function public.set_album_media(uuid, uuid[]) from public;
grant execute on function public.set_album_media(uuid, uuid[]) to authenticated;

-- -----------------------------------------------------------------------------
-- add_media_to_album(album, ids): appends photos to the end of an album.
-- -----------------------------------------------------------------------------
create or replace function public.add_media_to_album(p_album_id uuid, p_media_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  start_pos integer;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select coalesce(max(position), 0) into start_pos
    from public.album_media where album_id = p_album_id;

  insert into public.album_media (album_id, media_id, position)
  select p_album_id, x.id, start_pos + x.ord
    from unnest(coalesce(p_media_ids, '{}')) with ordinality as x(id, ord)
    join public.media m on m.id = x.id
  on conflict (album_id, media_id) do nothing;
end;
$$;

revoke all on function public.add_media_to_album(uuid, uuid[]) from public;
grant execute on function public.add_media_to_album(uuid, uuid[]) to authenticated;

-- -----------------------------------------------------------------------------
-- submit_booking(...): the ONLY way a booking is created. Called from the
-- website's server code with the server-only secret key (role service_role);
-- anonymous visitors cannot call it or touch the bookings table directly.
-- Handles: rate limit per visitor, duplicate submissions, date sanity,
-- hidden/inactive service or package, and title snapshots.
-- -----------------------------------------------------------------------------
create or replace function public.submit_booking(
  p_customer_name  text,
  p_phone          text,
  p_service_id     uuid,
  p_package_id     uuid,
  p_requested_date date,
  p_preferred_time text,
  p_location       text,
  p_notes          text,
  p_ip_hash        text,
  p_max_per_hour   integer default 5
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing      uuid;
  v_recent        integer;
  v_service_title text;
  v_package_title text;
  v_package_price text;
  v_id            uuid;
begin
  -- Date sanity (one day of slack for time-zone differences)
  if p_requested_date is null
     or p_requested_date < current_date - 1
     or p_requested_date > current_date + 1095 then
    raise exception 'invalid_date' using errcode = 'P0001';
  end if;

  -- Rate limit per visitor fingerprint
  if p_ip_hash is not null then
    select count(*) into v_recent
      from public.bookings b
     where b.ip_hash = p_ip_hash
       and b.created_at > now() - interval '1 hour';
    if v_recent >= greatest(p_max_per_hour, 1) then
      raise exception 'rate_limited' using errcode = 'P0001';
    end if;
  end if;

  -- Same phone + same date within 10 minutes = the same request (double submit)
  select b.id into v_existing
    from public.bookings b
   where b.phone = p_phone
     and b.requested_date = p_requested_date
     and b.created_at > now() - interval '10 minutes'
   order by b.created_at desc
   limit 1;
  if v_existing is not null then
    return v_existing;
  end if;

  if p_service_id is not null then
    select s.title into v_service_title from public.services s
     where s.id = p_service_id and s.active;
    if v_service_title is null then
      raise exception 'invalid_service' using errcode = 'P0001';
    end if;
  end if;

  if p_package_id is not null then
    select p.title,
           case when p.price is null then null
                else trim(both ' ' from to_char(p.price, 'FM999G999G999G990D99') || ' ' || p.currency) end
      into v_package_title, v_package_price
      from public.packages p
     where p.id = p_package_id and p.active;
    if v_package_title is null then
      raise exception 'invalid_package' using errcode = 'P0001';
    end if;
  end if;

  insert into public.bookings (
    customer_name, phone, service_id, service_title, package_id, package_title, package_price,
    requested_date, preferred_time, location, notes, ip_hash
  ) values (
    p_customer_name, p_phone, p_service_id, v_service_title, p_package_id, v_package_title, v_package_price,
    p_requested_date, nullif(p_preferred_time, ''), nullif(p_location, ''), nullif(p_notes, ''), p_ip_hash
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_booking(text, text, uuid, uuid, date, text, text, text, text, integer) from public, anon, authenticated;
grant execute on function public.submit_booking(text, text, uuid, uuid, date, text, text, text, text, integer) to service_role;

-- -----------------------------------------------------------------------------
-- Row Level Security on every table in the exposed "public" schema
-- -----------------------------------------------------------------------------
alter table public.admin_users   enable row level security;
alter table public.site_settings enable row level security;
alter table public.categories    enable row level security;
alter table public.media         enable row level security;
alter table public.albums        enable row level security;
alter table public.album_media   enable row level security;
alter table public.services      enable row level security;
alter table public.packages      enable row level security;
alter table public.bookings      enable row level security;

-- admin_users: a user may see their own row; admins see all. No write policies:
-- accounts are managed with the server-only script or the SQL editor.
drop policy if exists "admin_users: read own or admin" on public.admin_users;
create policy "admin_users: read own or admin" on public.admin_users
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- site_settings: public read, admin write
drop policy if exists "site_settings: public read" on public.site_settings;
create policy "site_settings: public read" on public.site_settings
  for select to anon, authenticated using (true);

drop policy if exists "site_settings: admin insert" on public.site_settings;
create policy "site_settings: admin insert" on public.site_settings
  for insert to authenticated with check ((select public.is_admin()));

drop policy if exists "site_settings: admin update" on public.site_settings;
create policy "site_settings: admin update" on public.site_settings
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- categories: public read, admin write
drop policy if exists "categories: public read" on public.categories;
create policy "categories: public read" on public.categories
  for select to anon, authenticated using (true);

drop policy if exists "categories: admin write" on public.categories;
create policy "categories: admin write" on public.categories
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- media: public sees published photos and photos inside published albums
drop policy if exists "media: public read" on public.media;
create policy "media: public read" on public.media
  for select to anon, authenticated
  using (
    published
    or (select public.is_admin())
    or exists (
      select 1
        from public.album_media am
        join public.albums a on a.id = am.album_id
       where am.media_id = media.id
         and a.status = 'published'
    )
  );

drop policy if exists "media: admin write" on public.media;
create policy "media: admin write" on public.media
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- albums: public sees published albums only
drop policy if exists "albums: public read" on public.albums;
create policy "albums: public read" on public.albums
  for select to anon, authenticated
  using (status = 'published' or (select public.is_admin()));

drop policy if exists "albums: admin write" on public.albums;
create policy "albums: admin write" on public.albums
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- album_media: public sees links of published albums only
drop policy if exists "album_media: public read" on public.album_media;
create policy "album_media: public read" on public.album_media
  for select to anon, authenticated
  using (
    (select public.is_admin())
    or exists (select 1 from public.albums a where a.id = album_id and a.status = 'published')
  );

drop policy if exists "album_media: admin write" on public.album_media;
create policy "album_media: admin write" on public.album_media
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- services: public sees active ones
drop policy if exists "services: public read" on public.services;
create policy "services: public read" on public.services
  for select to anon, authenticated
  using (active or (select public.is_admin()));

drop policy if exists "services: admin write" on public.services;
create policy "services: admin write" on public.services
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- packages: public sees active ones
drop policy if exists "packages: public read" on public.packages;
create policy "packages: public read" on public.packages
  for select to anon, authenticated
  using (active or (select public.is_admin()));

drop policy if exists "packages: admin write" on public.packages;
create policy "packages: admin write" on public.packages
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- bookings: admins only. No insert policy — inserts go through submit_booking().
drop policy if exists "bookings: admin read" on public.bookings;
create policy "bookings: admin read" on public.bookings
  for select to authenticated using ((select public.is_admin()));

drop policy if exists "bookings: admin update" on public.bookings;
create policy "bookings: admin update" on public.bookings
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "bookings: admin delete" on public.bookings;
create policy "bookings: admin delete" on public.bookings
  for delete to authenticated using ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- Defence in depth: remove table privileges anonymous visitors never need,
-- so a policy mistake cannot open a write path.
-- -----------------------------------------------------------------------------
revoke insert, update, delete, truncate, references, trigger
  on public.admin_users, public.site_settings, public.categories, public.media,
     public.albums, public.album_media, public.services, public.packages, public.bookings
  from anon;

revoke all on public.bookings    from anon;
revoke all on public.admin_users from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;
