-- Digitally signed partner hub MOUs, from the unlisted /partner-mou page.
-- Written only by the sign-partner-mou edge function; the public cannot read or write it.
-- Staff read it in Supabase: Table Editor -> partner_mous. TechBuzz Hub's signature is pre-applied by the
-- function, so countersigned_at / countersigned_by are not used (kept for records signed by hand).
create table if not exists public.partner_mous (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  hub_name text not null,
  hub_address text not null,
  rep_name text not null,
  rep_title text not null,
  email text not null,
  phone text not null,
  -- The hub's in-charge person (Auxiliary Organising Committee Member, clause 5.3).
  aux_name text not null,
  aux_phone text not null,
  aux_email text not null,
  -- The partner's drawn signature, as a PNG data URL. Paste it into a browser address bar to view it.
  signature_image text not null,
  mou_version text not null,
  -- The exact text the partner saw and signed.
  mou_text text not null,
  consents jsonb not null default '{}'::jsonb,
  signed_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  -- Outcome of the confirmation emails, e.g. {"partner": "sent", "team": "sent"}.
  emails jsonb not null default '{}'::jsonb,
  countersigned_at timestamptz,
  countersigned_by text,
  created_at timestamptz not null default now()
);

-- One signature per hub per version of the MOU.
create unique index if not exists partner_mous_hub_version_idx
  on public.partner_mous (lower(btrim(hub_name)), mou_version);

create index if not exists partner_mous_signed_idx on public.partner_mous (signed_at desc);
create index if not exists partner_mous_ip_idx on public.partner_mous (ip_address, created_at desc);

alter table public.partner_mous enable row level security;
revoke all on public.partner_mous from anon, authenticated;
grant all on public.partner_mous to service_role;
