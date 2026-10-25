-- "I will be there" poster: email confirmation codes and a record of who made one.
-- Written only by the poster edge function. The photo and poster image are never stored; the poster is emailed.
create table if not exists public.poster_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  used_at timestamptz,
  ip_address text,
  created_at timestamptz not null default now()
);
create index if not exists poster_codes_email_idx on public.poster_codes (lower(email), created_at desc);
create index if not exists poster_codes_ip_idx on public.poster_codes (ip_address, created_at desc);

create table if not exists public.posters (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  name text not null,
  email text not null,
  activity text not null,
  template text not null,
  tagline text,
  emailed boolean not null default false,
  ip_address text,
  created_at timestamptz not null default now()
);
create index if not exists posters_created_idx on public.posters (created_at desc);

alter table public.poster_codes enable row level security;
alter table public.posters enable row level security;
revoke all on public.poster_codes, public.posters from anon, authenticated;
grant all on public.poster_codes, public.posters to service_role;
