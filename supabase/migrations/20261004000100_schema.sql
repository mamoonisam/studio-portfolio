-- =============================================================================
-- Photographer portfolio — core schema
-- Safe to run more than once (idempotent): tables use IF NOT EXISTS, functions
-- use CREATE OR REPLACE, triggers/policies are dropped before re-creation.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- -----------------------------------------------------------------------------
-- Shared helper: keep updated_at current on every UPDATE
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- admin_users: who may manage the site. A signed-in user is NOT an admin unless
-- they have a row here. Roles leave room for future staff accounts.
--   owner  : full control (first account)
--   admin  : full content + bookings management
--   editor : reserved for a future, more limited role (no access today)
-- -----------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  role         text not null default 'admin' check (role in ('owner', 'admin', 'editor')),
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- site_settings: exactly one row (id = 1) holding every editable site text,
-- contact detail, social link, SEO field and appearance choice.
-- -----------------------------------------------------------------------------
create table if not exists public.site_settings (
  id                     smallint primary key default 1 check (id = 1),

  -- General
  photographer_name      text not null default '',
  studio_name            text not null default '',
  logo_path              text,
  favicon_path           text,
  hero_image_path        text,
  hero_title             text not null default '',
  hero_subtitle          text not null default '',
  hero_primary_label     text not null default '',
  hero_secondary_label   text not null default '',

  -- About
  about_image_path       text,
  about_title            text not null default '',
  about_short            text not null default '',
  about_text             text not null default '',
  about_story            text not null default '',
  about_extra            text not null default '',
  years_experience       integer check (years_experience is null or years_experience between 0 and 80),

  -- Section texts
  featured_title         text not null default '',
  featured_intro         text not null default '',
  services_title         text not null default '',
  services_intro         text not null default '',
  packages_title         text not null default '',
  packages_intro         text not null default '',
  portfolio_intro        text not null default '',
  cta_title              text not null default '',
  cta_text               text not null default '',
  cta_button_label       text not null default '',
  booking_intro          text not null default '',
  booking_success        text not null default '',
  contact_intro          text not null default '',
  footer_note            text not null default '',

  -- Contact
  phone                  text not null default '',
  whatsapp               text not null default '',
  email                  text not null default '',
  address                text not null default '',
  map_url                text not null default '',
  working_hours          text not null default '',
  -- Country calling code used to turn customers' local numbers (e.g. 0770...)
  -- into WhatsApp links from the bookings page. Example: 964
  phone_country_code     text not null default '' check (phone_country_code ~ '^[0-9]{0,4}$'),

  -- Social
  instagram_url          text not null default '',
  facebook_url           text not null default '',
  tiktok_url             text not null default '',
  youtube_url            text not null default '',

  -- SEO
  seo_title              text not null default '',
  seo_description        text not null default '',
  og_image_path          text,

  -- Appearance
  theme                  text not null default 'light' check (theme in ('light', 'dark', 'system')),
  accent                 text not null default 'brass' check (accent in ('brass', 'sage', 'slate', 'rose')),

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- categories: portfolio categories created by the photographer
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 1 and 80),
  slug          text not null unique check (char_length(slug) between 1 and 120),
  description   text,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- media: every portfolio photo stored in Supabase Storage (bucket "media")
-- Deleting a category keeps the photo (category_id becomes null).
-- -----------------------------------------------------------------------------
create table if not exists public.media (
  id            uuid primary key default gen_random_uuid(),
  storage_path  text not null unique check (char_length(storage_path) between 1 and 300),
  title         text check (title is null or char_length(title) <= 200),
  alt_text      text check (alt_text is null or char_length(alt_text) <= 300),
  width         integer check (width is null or width > 0),
  height        integer check (height is null or height > 0),
  size_bytes    bigint check (size_bytes is null or size_bytes >= 0),
  mime_type     text,
  blur_data_url text check (blur_data_url is null or char_length(blur_data_url) <= 4000),
  category_id   uuid references public.categories (id) on delete set null,
  featured      boolean not null default false,
  published     boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- albums: a named collection of photos with its own page /portfolio/[slug]
-- Deleting the cover photo clears cover_media_id (album falls back to its first photo).
-- -----------------------------------------------------------------------------
create table if not exists public.albums (
  id             uuid primary key default gen_random_uuid(),
  title          text not null check (char_length(title) between 1 and 200),
  slug           text not null unique check (char_length(slug) between 1 and 200),
  description    text,
  category_id    uuid references public.categories (id) on delete set null,
  cover_media_id uuid references public.media (id) on delete set null,
  status         text not null default 'draft' check (status in ('draft', 'published')),
  display_order  integer not null default 0,
  event_date     date,
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- album_media: many-to-many with a position for ordering inside an album.
-- Removing an album or a photo removes only the link row.
create table if not exists public.album_media (
  album_id   uuid not null references public.albums (id) on delete cascade,
  media_id   uuid not null references public.media (id) on delete cascade,
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (album_id, media_id)
);

-- -----------------------------------------------------------------------------
-- services
-- -----------------------------------------------------------------------------
create table if not exists public.services (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (char_length(title) between 1 and 120),
  slug          text not null unique check (char_length(slug) between 1 and 160),
  description   text,
  image_path    text,
  active        boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- packages: prices and currency are data, never code. features = JSON array of text.
-- price may be null ("price on request").
-- -----------------------------------------------------------------------------
create table if not exists public.packages (
  id               uuid primary key default gen_random_uuid(),
  title            text not null check (char_length(title) between 1 and 120),
  description      text,
  price            numeric(14, 2) check (price is null or price >= 0),
  currency         text not null default '' check (char_length(currency) <= 12),
  features         jsonb not null default '[]'::jsonb check (jsonb_typeof(features) = 'array'),
  cover_image_path text,
  featured         boolean not null default false,
  display_order    integer not null default 0,
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- bookings: private. service/package titles are copied at booking time so the
-- request keeps its meaning if the service or package is deleted later.
-- -----------------------------------------------------------------------------
create table if not exists public.bookings (
  id             uuid primary key default gen_random_uuid(),
  customer_name  text not null check (char_length(customer_name) between 2 and 120),
  phone          text not null check (char_length(phone) between 6 and 30),
  service_id     uuid references public.services (id) on delete set null,
  service_title  text,
  package_id     uuid references public.packages (id) on delete set null,
  package_title  text,
  package_price  text,
  requested_date date not null,
  preferred_time text check (preferred_time is null or char_length(preferred_time) <= 60),
  location       text check (location is null or char_length(location) <= 300),
  notes          text check (notes is null or char_length(notes) <= 2000),
  status         text not null default 'new'
                 check (status in ('new', 'contacted', 'confirmed', 'completed', 'cancelled')),
  admin_notes    text check (admin_notes is null or char_length(admin_notes) <= 5000),
  ip_hash        text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Indexes (filtering, sorting, foreign keys, slugs, status, created_at)
-- Unique slugs already have unique indexes from their constraints.
-- -----------------------------------------------------------------------------
create index if not exists categories_display_order_idx on public.categories (display_order, created_at);

create index if not exists media_category_id_idx       on public.media (category_id);
create index if not exists media_order_idx             on public.media (display_order, created_at desc);
create index if not exists media_featured_idx          on public.media (display_order) where featured;
create index if not exists media_published_idx         on public.media (published);
create index if not exists media_created_at_idx        on public.media (created_at desc);

create index if not exists albums_status_order_idx     on public.albums (status, display_order, created_at desc);
create index if not exists albums_category_id_idx      on public.albums (category_id);
create index if not exists albums_cover_media_id_idx   on public.albums (cover_media_id);

create index if not exists album_media_media_id_idx    on public.album_media (media_id);
create index if not exists album_media_position_idx    on public.album_media (album_id, position);

create index if not exists services_active_order_idx   on public.services (active, display_order);
create index if not exists packages_active_order_idx   on public.packages (active, display_order);

create index if not exists bookings_status_idx         on public.bookings (status, created_at desc);
create index if not exists bookings_created_at_idx     on public.bookings (created_at desc);
create index if not exists bookings_requested_date_idx on public.bookings (requested_date);
create index if not exists bookings_service_id_idx     on public.bookings (service_id);
create index if not exists bookings_package_id_idx     on public.bookings (package_id);
create index if not exists bookings_ip_hash_idx        on public.bookings (ip_hash, created_at desc);
create index if not exists bookings_phone_idx          on public.bookings (phone, created_at desc);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['admin_users', 'site_settings', 'categories', 'media', 'albums',
                           'services', 'packages', 'bookings']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;

-- Keep albums.published_at in step with status
create or replace function public.albums_set_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at = coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists albums_published_at on public.albums;
create trigger albums_published_at before insert or update of status on public.albums
  for each row execute function public.albums_set_published_at();

-- -----------------------------------------------------------------------------
-- The single settings row, with starter texts the photographer can change.
-- -----------------------------------------------------------------------------
insert into public.site_settings (
  id, studio_name, hero_title, hero_subtitle, hero_primary_label, hero_secondary_label,
  about_title, featured_title, services_title, packages_title,
  cta_title, cta_text, cta_button_label, booking_success
) values (
  1, 'اسم الاستوديو', 'اسم الاستوديو', 'نوثّق لحظاتكم بعناية وهدوء.', 'شاهد أعمالنا', 'احجز جلستك',
  'من نحن', 'أعمال مختارة', 'الخدمات', 'الباقات',
  'جاهز لحجز جلستك؟', 'أرسل طلبك وسنتواصل معك لتأكيد الموعد.', 'احجز الآن',
  'تم استلام طلبك بنجاح. سنتواصل معك قريبًا لتأكيد التفاصيل.'
)
on conflict (id) do nothing;
