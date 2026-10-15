-- Affiliate tracking (GoAffPro). Volunteers are affiliates: their link is haramberun.com/?ref=<code>.
-- The website remembers the code for 7 days and sends it with payments and enquiries (leads).
alter table public.payments add column if not exists referral_code text;
-- Set when the sale was sent to GoAffPro; stops the same sale being sent twice.
alter table public.payments add column if not exists affiliate_reported_at timestamptz;
create index if not exists payments_referral_code_idx on public.payments (referral_code) where referral_code is not null;

alter table public.enquiries add column if not exists referral_code text;
create index if not exists enquiries_referral_code_idx on public.enquiries (referral_code) where referral_code is not null;

-- One place for staff to see everything a volunteer brought in (Supabase: Table Editor -> referral_activity).
create or replace view public.referral_activity with (security_invoker = true) as
  select referral_code, 'Payment: ' || purpose as kind, full_name as name, amount, status, reference, affiliate_reported_at, created_at
    from public.payments where referral_code is not null
  union all
  select referral_code, 'Enquiry: ' || type, name, null, status, id::text, null, created_at
    from public.enquiries where referral_code is not null;
revoke all on public.referral_activity from anon, authenticated;
grant select on public.referral_activity to service_role;
