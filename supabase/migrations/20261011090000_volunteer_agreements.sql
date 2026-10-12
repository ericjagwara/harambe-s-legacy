-- Digitally signed volunteer agreements, from the unlisted /volunteer-agreement page.
-- Written only by the sign-volunteer-agreement edge function; the public cannot read or write it.
-- Staff read it in Supabase: Table Editor -> volunteer_agreements.
create table if not exists public.volunteer_agreements (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  full_name text not null,
  email text not null,
  phone text not null,
  role text not null,
  typed_signature text not null,
  -- Optional drawn signature, as a PNG data URL. Paste it into a browser address bar to view it.
  signature_image text,
  agreement_version text not null,
  -- The exact text the volunteer saw and signed.
  agreement_text text not null,
  consents jsonb not null default '{}'::jsonb,
  signed_at timestamptz not null default now(),
  -- Evidence of signing.
  ip_address text,
  user_agent text,
  -- Outcome of the confirmation emails, e.g. {"volunteer": "sent", "team": "sent"}.
  emails jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- One signature per email address per version of the agreement.
create unique index if not exists volunteer_agreements_email_version_idx
  on public.volunteer_agreements (lower(email), agreement_version);

create index if not exists volunteer_agreements_signed_idx on public.volunteer_agreements (signed_at desc);
create index if not exists volunteer_agreements_ip_idx on public.volunteer_agreements (ip_address, created_at desc);

alter table public.volunteer_agreements enable row level security;
revoke all on public.volunteer_agreements from anon, authenticated;
grant all on public.volunteer_agreements to service_role;
