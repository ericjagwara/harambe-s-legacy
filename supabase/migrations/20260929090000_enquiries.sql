-- Sponsor, exhibitor and volunteer submissions from the registration page.
-- Written only by the submit-enquiry edge function; the public cannot read or write it.
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('Sponsorship', 'Exhibition', 'Volunteer')),
  name text not null,
  organisation text,
  email text not null,
  phone text not null,
  choice text,
  details jsonb not null default '{}'::jsonb,
  status text not null default 'New',
  created_at timestamptz not null default now()
);

create index if not exists enquiries_created_idx on public.enquiries (created_at desc);

alter table public.enquiries enable row level security;
revoke all on public.enquiries from anon, authenticated;
grant all on public.enquiries to service_role;
