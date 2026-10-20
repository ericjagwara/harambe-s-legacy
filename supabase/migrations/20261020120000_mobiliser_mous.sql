-- Digitally signed Resource Mobiliser MOUs, from the unlisted /mobiliser-mou page.
-- Written only by the sign-mobiliser-mou edge function; the public cannot read or write it.
-- Staff read it in Supabase: Table Editor -> mobiliser_mous. TechBuzz Hub's signature is pre-applied by the function.
create table if not exists public.mobiliser_mous (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  mobiliser_name text not null,
  mobiliser_address text not null,
  rep_name text not null,
  rep_title text not null,
  email text not null,
  phone text not null,
  -- Mobile money number or bank account where commission is paid (clause 5.3.4).
  payout_details text not null,
  signature_image text not null,
  mou_version text not null,
  mou_text text not null,
  consents jsonb not null default '{}'::jsonb,
  signed_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  emails jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create unique index if not exists mobiliser_mous_name_version_idx
  on public.mobiliser_mous (lower(btrim(mobiliser_name)), mou_version);
create index if not exists mobiliser_mous_signed_idx on public.mobiliser_mous (signed_at desc);
create index if not exists mobiliser_mous_ip_idx on public.mobiliser_mous (ip_address, created_at desc);
alter table public.mobiliser_mous enable row level security;
revoke all on public.mobiliser_mous from anon, authenticated;
grant all on public.mobiliser_mous to service_role;
