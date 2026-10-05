-- =============================================================================
-- Videos: YouTube videos shown on the site (homepage + /videos page).
-- Only the YouTube video id is stored; the video itself stays on YouTube
-- (it can be "Unlisted" so it does not appear on the photographer's channel).
-- Safe to run more than once.
-- =============================================================================

create table if not exists public.videos (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (char_length(title) between 1 and 200),
  youtube_id    text not null check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  -- Shorts / reels are vertical (9:16); normal videos are 16:9.
  vertical      boolean not null default false,
  -- Shown in the "Videos" section of the homepage.
  featured      boolean not null default true,
  published     boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists videos_order_idx     on public.videos (display_order, created_at desc);
create index if not exists videos_published_idx on public.videos (published);

drop trigger if exists set_updated_at on public.videos;
create trigger set_updated_at before update on public.videos
  for each row execute function public.set_updated_at();

-- Row Level Security: visitors see published videos only; admins manage all.
alter table public.videos enable row level security;

drop policy if exists "videos: public read" on public.videos;
create policy "videos: public read" on public.videos
  for select to anon, authenticated
  using (published or (select public.is_admin()));

drop policy if exists "videos: admin write" on public.videos;
create policy "videos: admin write" on public.videos
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

revoke insert, update, delete, truncate, references, trigger on public.videos from anon;
revoke truncate, references, trigger on public.videos from authenticated;

-- reorder_items(): allow the new table (same function as before + 'videos').
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

  if p_table not in ('categories', 'media', 'albums', 'services', 'packages', 'videos') then
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
