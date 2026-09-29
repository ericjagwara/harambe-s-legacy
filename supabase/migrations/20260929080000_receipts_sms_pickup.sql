-- Kit pickup tracking, confirmation SMS tracking, and exactly-once completion of successful payments.
alter table public.payments
  add column if not exists collected_at timestamptz,
  add column if not exists collected_by text,
  add column if not exists sms_sent_at timestamptz;

create index if not exists payments_msisdn_idx on public.payments (msisdn);

-- Settle a successful payment exactly once, even if the Blink callback and the
-- status poll arrive at the same moment. Returns true only for the caller that
-- should send the confirmation SMS.
create or replace function public.complete_payment(p_payment_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.payments%rowtype;
  new_contribution uuid;
begin
  select * into p from public.payments where id = p_payment_id for update;
  if not found or p.status <> 'SUCCESSFUL' then
    return false;
  end if;

  if p.contribution_id is null then
    insert into public.contributions (name, type, amount, is_anonymous)
    values (
      case when p.is_anonymous then 'Anonymous contributor' else p.full_name end,
      case when p.purpose = 'Donation' then 'Online donation' else 'Runner ticket' end,
      p.amount,
      p.is_anonymous
    )
    returning id into new_contribution;
    update public.payments set contribution_id = new_contribution where id = p.id;
  end if;

  if p.sms_sent_at is null then
    update public.payments set sms_sent_at = now() where id = p.id;
    return true;
  end if;
  return false;
end;
$$;

revoke all on function public.complete_payment(uuid) from public, anon, authenticated;
grant execute on function public.complete_payment(uuid) to service_role;
