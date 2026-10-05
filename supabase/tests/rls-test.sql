-- =============================================================================
-- LOCAL TESTING ONLY. Security + data integrity tests for the migrations.
-- Run with supabase/tests/run-local.sh (plain PostgreSQL + local-stub.sql).
-- Every check raises an exception on failure, so the script stops at the
-- first problem and prints "ALL TESTS PASSED" at the end otherwise.
-- =============================================================================
\set ON_ERROR_STOP on
set client_min_messages = warning;

create schema if not exists t;
grant usage on schema t to anon, authenticated, service_role;

create or replace function t.fails(p_sql text) returns boolean language plpgsql as $$
begin
  execute p_sql;
  return false;
exception when others then
  return true;
end $$;

create or replace function t.affected(p_sql text) returns integer language plpgsql as $$
declare n integer;
begin
  execute p_sql;
  get diagnostics n = row_count;
  return n;
exception when others then
  return -1;
end $$;

create or replace function t.ok(p_cond boolean, p_name text) returns void language plpgsql as $$
begin
  if p_cond is distinct from true then
    raise exception 'FAILED: %', p_name;
  end if;
  raise notice 'ok - %', p_name;
end $$;

grant execute on all functions in schema t to anon, authenticated, service_role;

create or replace function t.as_user(p_uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
$$;
grant execute on function t.as_user(uuid) to anon, authenticated, service_role;

set client_min_messages = notice;

-- ---------------------------------------------------------------------------
-- Fixtures (as superuser)
-- ---------------------------------------------------------------------------
truncate public.bookings, public.album_media, public.albums, public.media, public.categories,
         public.services, public.packages, public.admin_users cascade;
delete from auth.users;
delete from storage.objects;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner@example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'visitor-account@example.com');
insert into public.admin_users (user_id, role) values ('00000000-0000-0000-0000-00000000000a', 'owner');

insert into public.categories (id, name, slug) values
  ('10000000-0000-0000-0000-000000000001', 'أعراس', 'أعراس');

insert into public.media (id, storage_path, category_id, published) values
  ('20000000-0000-0000-0000-000000000001', 'portfolio/2026/10/a.jpg', '10000000-0000-0000-0000-000000000001', true),
  ('20000000-0000-0000-0000-000000000002', 'portfolio/2026/10/b.jpg', null, false),
  ('20000000-0000-0000-0000-000000000003', 'portfolio/2026/10/c.jpg', null, false);

insert into public.albums (id, title, slug, status, cover_media_id) values
  ('30000000-0000-0000-0000-000000000001', 'مسودة', 'draft-album', 'draft', null),
  ('30000000-0000-0000-0000-000000000002', 'حفل زفاف', 'حفل-زفاف', 'published', '20000000-0000-0000-0000-000000000003');

insert into public.album_media (album_id, media_id, position) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 1),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', 1),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 2);

insert into public.services (id, title, slug, active) values
  ('40000000-0000-0000-0000-000000000001', 'تصوير أعراس', 'weddings', true),
  ('40000000-0000-0000-0000-000000000002', 'خدمة مخفية', 'hidden', false);

insert into public.packages (id, title, price, currency, features, active) values
  ('50000000-0000-0000-0000-000000000001', 'الباقة الذهبية', 250000, 'د.ع', '["ساعتان تصوير"]', true),
  ('50000000-0000-0000-0000-000000000002', 'باقة مخفية', 100, '$', '[]', false);

insert into storage.objects (bucket_id, name) values ('media', 'portfolio/2026/10/a.jpg');

-- ---------------------------------------------------------------------------
-- service_role: booking creation path
-- ---------------------------------------------------------------------------
begin;
set local role service_role;
select t.ok(public.submit_booking('سارة أحمد', '07700000001', '40000000-0000-0000-0000-000000000001',
        '50000000-0000-0000-0000-000000000001', current_date + 10, 'مساءً', 'بغداد', 'ملاحظة', 'ip-1') is not null,
        'service_role can create a booking');
select t.ok((select count(*) from public.bookings) = 1, 'booking stored');
select t.ok((select package_title from public.bookings limit 1) = 'الباقة الذهبية', 'package title snapshot stored');
select t.ok((select package_price from public.bookings limit 1) like '250,000%د.ع', 'package price snapshot stored');
select t.ok(
  public.submit_booking('سارة أحمد', '07700000001', null, null, current_date + 10, '', '', '', 'ip-1')
  = (select id from public.bookings limit 1),
  'double submit returns the existing booking');
select t.ok((select count(*) from public.bookings) = 1, 'double submit did not create a duplicate');
select t.ok(t.fails($$select public.submit_booking('x y', '07700000002', null, null, current_date - 30, '', '', '', 'ip-2')$$),
        'past date rejected');
select t.ok(t.fails($$select public.submit_booking('x y', '07700000002', null, null, current_date + 5000, '', '', '', 'ip-2')$$),
        'far future date rejected');
select t.ok(t.fails($$select public.submit_booking('x y', '07700000002', '40000000-0000-0000-0000-000000000002', null, current_date + 3, '', '', '', 'ip-2')$$),
        'hidden service rejected');
select t.ok(t.fails($$select public.submit_booking('x y', '07700000002', null, '50000000-0000-0000-0000-000000000002', current_date + 3, '', '', '', 'ip-2')$$),
        'hidden package rejected');
select public.submit_booking('زائر', '0770000010' || g, null, null, current_date + 3, '', '', '', 'ip-3') from generate_series(1, 5) g;
select t.ok(t.fails($$select public.submit_booking('زائر', '07700000199', null, null, current_date + 3, '', '', '', 'ip-3')$$),
        'rate limit blocks the 6th booking from one visitor within an hour');
commit;

-- ---------------------------------------------------------------------------
-- anon (website visitor, not signed in)
-- ---------------------------------------------------------------------------
begin;
set local role anon;
select set_config('request.jwt.claims', '', true);
select t.ok(not public.is_admin(), 'anon is not admin');
select t.ok((select count(*) from public.site_settings) = 1, 'anon reads settings');
select t.ok((select count(*) from public.media) = 2, 'anon sees published photos + photos of published albums only');
select t.ok(not exists (select 1 from public.media where id = '20000000-0000-0000-0000-000000000002'), 'anon cannot see photo of draft album');
select t.ok((select count(*) from public.albums) = 1, 'anon sees published albums only');
select t.ok((select count(*) from public.album_media) = 2, 'anon sees links of published albums only');
select t.ok((select count(*) from public.services) = 1, 'anon sees active services only');
select t.ok((select count(*) from public.packages) = 1, 'anon sees active packages only');
select t.ok(t.fails('select * from public.bookings'), 'anon cannot read bookings');
select t.ok(t.fails('select admin_notes from public.bookings'), 'anon cannot read admin notes');
select t.ok(t.fails('select * from public.admin_users'), 'anon cannot read admin_users');
select t.ok(t.fails($$insert into public.bookings (customer_name, phone, requested_date) values ('aa', '0770000000', current_date + 1)$$),
        'anon cannot insert into bookings directly');
select t.ok(t.fails($$insert into public.media (storage_path) values ('portfolio/x.jpg')$$), 'anon cannot insert media');
select t.ok(t.fails($$update public.packages set price = 1$$), 'anon cannot update prices');
select t.ok(t.fails($$delete from public.albums$$), 'anon cannot delete albums');
select t.ok(t.fails($$update public.site_settings set studio_name = 'hacked'$$), 'anon cannot update settings');
select t.ok(t.fails($$insert into public.admin_users (user_id) values ('00000000-0000-0000-0000-00000000000b')$$), 'anon cannot make admins');
select t.ok(t.fails($$select public.submit_booking('aa', '0770000000', null, null, current_date + 1, '', '', '', null)$$),
        'anon cannot call submit_booking directly');
select t.ok(t.fails($$select public.reorder_items('packages', array['50000000-0000-0000-0000-000000000001']::uuid[])$$), 'anon cannot reorder');
select t.ok(t.fails($$insert into storage.objects (bucket_id, name) values ('media', 'portfolio/evil.jpg')$$), 'anon cannot upload to storage');
select t.ok(t.affected($$delete from storage.objects where bucket_id = 'media'$$) <= 0, 'anon cannot delete from storage');
select t.ok((select count(*) from storage.objects) = 0, 'anon cannot list storage objects');
commit;

-- ---------------------------------------------------------------------------
-- authenticated but NOT an admin (e.g. a future non-admin account)
-- ---------------------------------------------------------------------------
begin;
set local role authenticated;
select t.as_user('00000000-0000-0000-0000-00000000000b');
select t.ok(not public.is_admin(), 'signed-in non-admin is not admin');
select t.ok((select count(*) from public.bookings) = 0, 'non-admin sees no bookings');
select t.ok((select count(*) from public.admin_users) = 0, 'non-admin sees no admin rows');
select t.ok(t.affected($$update public.packages set price = 1$$) = 0, 'non-admin cannot change prices');
select t.ok(t.fails($$insert into public.media (storage_path) values ('portfolio/x.jpg')$$), 'non-admin cannot insert media');
select t.ok(t.affected($$delete from public.albums$$) = 0, 'non-admin cannot delete albums');
select t.ok(t.affected($$update public.site_settings set studio_name = 'x'$$) = 0, 'non-admin cannot update settings');
select t.ok(t.fails($$insert into public.admin_users (user_id, role) values ('00000000-0000-0000-0000-00000000000b', 'owner')$$),
        'non-admin cannot promote themselves');
select t.ok(t.fails($$select public.reorder_items('packages', array['50000000-0000-0000-0000-000000000001']::uuid[])$$), 'non-admin cannot reorder');
select t.ok(t.fails($$insert into storage.objects (bucket_id, name) values ('media', 'portfolio/evil.jpg')$$), 'non-admin cannot upload');
select t.ok(t.affected($$delete from storage.objects where bucket_id = 'media'$$) = 0, 'non-admin cannot delete storage objects');
commit;

-- ---------------------------------------------------------------------------
-- admin
-- ---------------------------------------------------------------------------
begin;
set local role authenticated;
select t.as_user('00000000-0000-0000-0000-00000000000a');
select t.ok(public.is_admin(), 'owner is admin');
select t.ok((select count(*) from public.bookings) = 6, 'admin reads all bookings');
select t.ok(t.affected($$update public.bookings set status = 'confirmed', admin_notes = 'اتصلت' where phone = '07700000001'$$) = 1,
        'admin changes booking status and notes');
select t.ok(t.fails($$update public.bookings set status = 'unknown'$$), 'invalid booking status rejected');
select t.ok((select count(*) from public.media) = 3, 'admin sees all photos');
select t.ok((select count(*) from public.albums) = 2, 'admin sees drafts');
select t.ok(t.affected($$insert into public.media (storage_path) values ('portfolio/2026/10/new.jpg')$$) = 1, 'admin adds media');
select t.ok(t.fails($$insert into public.media (storage_path) values ('portfolio/2026/10/new.jpg')$$), 'duplicate storage path rejected');
select t.ok(t.affected($$update public.packages set price = 300000 where id = '50000000-0000-0000-0000-000000000001'$$) = 1, 'admin changes price');
select t.ok(t.affected($$update public.packages set active = false where id = '50000000-0000-0000-0000-000000000001'$$) = 1, 'admin hides package');
select t.ok(t.fails($$update public.packages set features = '"not an array"'$$), 'features must be a list');
select t.ok(t.fails($$insert into public.albums (title, slug) values ('x', 'حفل-زفاف')$$), 'duplicate album slug rejected');
select t.ok(t.affected($$update public.site_settings set studio_name = 'استوديو الضوء'$$) = 1, 'admin updates settings');
select t.ok(t.affected($$insert into storage.objects (bucket_id, name) values ('media', 'portfolio/2026/10/new.jpg')$$) = 1, 'admin uploads');
select t.ok(t.affected($$delete from storage.objects where name = 'portfolio/2026/10/new.jpg'$$) = 1, 'admin deletes upload');

select public.reorder_items('packages', array['50000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001']::uuid[]);
select t.ok((select display_order from public.packages where id = '50000000-0000-0000-0000-000000000001') = 2, 'reorder works');
select t.ok(t.fails($$select public.reorder_items('bookings', array[]::uuid[])$$), 'reorder refuses tables outside the list');

select public.set_album_media('30000000-0000-0000-0000-000000000002', array['20000000-0000-0000-0000-000000000001']::uuid[]);
select t.ok((select count(*) from public.album_media where album_id = '30000000-0000-0000-0000-000000000002') = 1, 'set_album_media replaces photos');
select t.ok((select cover_media_id from public.albums where id = '30000000-0000-0000-0000-000000000002') is null, 'cover cleared when removed from album');

select public.add_media_to_album('30000000-0000-0000-0000-000000000002', array['20000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001']::uuid[]);
select t.ok((select position from public.album_media where album_id = '30000000-0000-0000-0000-000000000002' and media_id = '20000000-0000-0000-0000-000000000003') = 2,
        'add_media_to_album appends at the end and skips existing');

update public.albums set cover_media_id = '20000000-0000-0000-0000-000000000003' where id = '30000000-0000-0000-0000-000000000002';
delete from public.media where id = '20000000-0000-0000-0000-000000000003';
select t.ok((select cover_media_id from public.albums where id = '30000000-0000-0000-0000-000000000002') is null, 'deleting the cover photo clears the cover');
select t.ok((select count(*) from public.albums) = 2, 'deleting a photo keeps the album');

delete from public.categories where id = '10000000-0000-0000-0000-000000000001';
select t.ok((select category_id from public.media where id = '20000000-0000-0000-0000-000000000001') is null, 'deleting a category keeps its photos');

delete from public.services where id = '40000000-0000-0000-0000-000000000001';
select t.ok((select service_title from public.bookings where phone = '07700000001') = 'تصوير أعراس', 'booking keeps service name after service deletion');

select t.ok((select published_at is not null from public.albums where id = '30000000-0000-0000-0000-000000000002'), 'published_at set');
select t.ok(t.affected($$delete from public.albums where id = '30000000-0000-0000-0000-000000000001'$$) = 1, 'admin deletes album');
rollback;

select 'ALL TESTS PASSED' as result;
