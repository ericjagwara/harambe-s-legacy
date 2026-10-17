-- Partner hub pages can add an optional extra donation to a kit, paid in one payment (details.extra_donation).
-- The public board and totals then show the kit as a ticket and the extra as a donation.
-- Payments without an extra donation (every main-site registration) take exactly the same path as before.
create or replace function public.complete_payment(p_payment_id uuid)
 returns boolean
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  p public.payments%rowtype;
  new_contribution uuid;
  extra numeric := 0;
begin
  select * into p from public.payments where id = p_payment_id for update;
  if not found or p.status <> 'SUCCESSFUL' then
    return false;
  end if;

  if p.contribution_id is null then
    if p.purpose = 'Runner registration' then
      extra := coalesce((p.details ->> 'extra_donation')::numeric, 0);
      if extra < 0 or extra >= p.amount then extra := 0; end if;
    end if;

    insert into public.contributions (name, type, amount, is_anonymous)
    values (
      case when p.is_anonymous then 'Anonymous contributor' else p.full_name end,
      case when p.purpose = 'Donation' then 'Online donation' else 'Runner ticket' end,
      p.amount - extra,
      p.is_anonymous
    )
    returning id into new_contribution;
    update public.payments set contribution_id = new_contribution where id = p.id;

    if extra > 0 then
      insert into public.contributions (name, type, amount, is_anonymous)
      values (
        case when p.is_anonymous then 'Anonymous contributor' else p.full_name end,
        'Online donation',
        extra,
        p.is_anonymous
      );
    end if;
  end if;

  if p.sms_sent_at is null then
    update public.payments set sms_sent_at = now() where id = p.id;
    return true;
  end if;
  return false;
end;
$function$;

create or replace function public.analytics_report(days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  since timestamptz := case when days <= 0 then '-infinity'::timestamptz else now() - make_interval(days => days) end;
  series_days integer := case when days <= 0 or days > 90 then 90 else days end;
  today date := (now() at time zone 'Africa/Kampala')::date;
  r jsonb := '{}'::jsonb;
  x jsonb;
begin
  -- Headline numbers
  select jsonb_build_object(
    'sessions', count(distinct session_id),
    'visitors', count(distinct visitor_id),
    'pageviews', count(*)
  ) into x from site_events where event = 'pageview' and created_at >= since;
  r := r || jsonb_build_object('traffic', x);

  -- Daily series (Kampala time)
  select coalesce(jsonb_agg(jsonb_build_object(
      'date', g.d::text,
      'visits', coalesce(v.s, 0),
      'pageviews', coalesce(v.n, 0),
      'attempts', coalesce(t.c, 0),
      'paid', coalesce(p.c, 0),
      'paid_amount', coalesce(p.a, 0)
    ) order by g.d), '[]'::jsonb) into x
  from generate_series(0, series_days - 1) as gs(n)
  cross join lateral (select (today - gs.n) as d) g
  left join (
    select (created_at at time zone 'Africa/Kampala')::date d, count(distinct session_id) s, count(*) n
    from site_events where event = 'pageview' and created_at >= now() - interval '95 days' group by 1
  ) v on v.d = g.d
  left join (
    select (created_at at time zone 'Africa/Kampala')::date d, count(*) c
    from payments where created_at >= now() - interval '95 days' group by 1
  ) t on t.d = g.d
  left join (
    select (p.created_at at time zone 'Africa/Kampala')::date d, count(*) c, sum(p.amount) a
    from payments p left join contributions c on c.id = p.contribution_id
    where p.status = 'SUCCESSFUL' and coalesce(c.hidden, false) = false and p.created_at >= now() - interval '95 days' group by 1
  ) p on p.d = g.d;
  r := r || jsonb_build_object('daily', x);

  -- Funnel
  select jsonb_build_object(
    'sessions', (select count(distinct session_id) from site_events where event = 'pageview' and created_at >= since),
    'form_page_sessions', (select count(distinct session_id) from site_events where event = 'pageview' and created_at >= since
        and (path in ('/register', '/donate') or path like '/hubs/%')),
    'form_start_sessions', (select count(distinct session_id) from site_events where event = 'form_start' and created_at >= since),
    'pay_attempt_sessions', (select count(distinct session_id) from site_events where event = 'pay_attempt' and created_at >= since),
    'payments_created', (select count(*) from payments where created_at >= since),
    'payments_paid', (select count(*) from payments p left join contributions c on c.id = p.contribution_id
        where p.created_at >= since and p.status = 'SUCCESSFUL' and coalesce(c.hidden, false) = false)
  ) into x;
  r := r || jsonb_build_object('funnel', x);

  -- Payments by purpose, status and method
  select coalesce(jsonb_agg(jsonb_build_object('purpose', purpose, 'status', status, 'method', m, 'count', n, 'amount', a, 'extra', ex)), '[]'::jsonb) into x
  from (
    select p.purpose, p.status, case when p.details ->> 'method' = 'card' then 'card' else 'mobile' end m,
           count(*) n, coalesce(sum(p.amount), 0) a,
           coalesce(sum((p.details ->> 'extra_donation')::numeric) filter (where p.purpose = 'Runner registration'), 0) ex
    from payments p left join contributions c on c.id = p.contribution_id
    where p.created_at >= since and (p.status <> 'SUCCESSFUL' or coalesce(c.hidden, false) = false)
    group by 1, 2, 3
  ) s;
  r := r || jsonb_build_object('payments', x);

  -- Runner categories and distances (paid)
  select coalesce(jsonb_agg(jsonb_build_object('label', label, 'count', n, 'amount', a) order by n desc), '[]'::jsonb) into x
  from (
    select coalesce(p.details ->> 'category', 'Unknown') label, count(*) n, sum(p.amount) a
    from payments p left join contributions c on c.id = p.contribution_id
    where p.purpose = 'Runner registration' and p.status = 'SUCCESSFUL' and coalesce(c.hidden, false) = false and p.created_at >= since
    group by 1
  ) s;
  r := r || jsonb_build_object('categories', x);

  select coalesce(jsonb_agg(jsonb_build_object('label', label, 'count', n) order by n desc), '[]'::jsonb) into x
  from (
    select coalesce(p.details ->> 'distance', 'Unknown') label, count(*) n
    from payments p left join contributions c on c.id = p.contribution_id
    where p.purpose = 'Runner registration' and p.status = 'SUCCESSFUL' and coalesce(c.hidden, false) = false and p.created_at >= since
    group by 1
  ) s;
  r := r || jsonb_build_object('distances', x);

  -- Top pages
  select coalesce(jsonb_agg(jsonb_build_object('path', path, 'views', n, 'sessions', s) order by n desc), '[]'::jsonb) into x
  from (
    select path, count(*) n, count(distinct session_id) s from site_events
    where event = 'pageview' and created_at >= since group by 1 order by 2 desc limit 15
  ) s;
  r := r || jsonb_build_object('pages', x);

  -- Where visitors came from, devices and countries (first page of each visit)
  select coalesce(jsonb_agg(jsonb_build_object('label', label, 'count', n) order by n desc), '[]'::jsonb) into x
  from (
    select coalesce(nullif(utm_source, ''), nullif(referrer_host, ''), 'Direct') label, count(*) n
    from (select distinct on (session_id) * from site_events where event = 'pageview' and created_at >= since order by session_id, created_at) f
    group by 1 order by 2 desc limit 12
  ) s;
  r := r || jsonb_build_object('sources', x);

  select coalesce(jsonb_agg(jsonb_build_object('label', label, 'count', n) order by n desc), '[]'::jsonb) into x
  from (
    select coalesce(nullif(device, ''), 'Unknown') label, count(*) n
    from (select distinct on (session_id) * from site_events where event = 'pageview' and created_at >= since order by session_id, created_at) f
    group by 1
  ) s;
  r := r || jsonb_build_object('devices', x);

  select coalesce(jsonb_agg(jsonb_build_object('label', label, 'count', n) order by n desc), '[]'::jsonb) into x
  from (
    select coalesce(nullif(country, ''), 'Unknown') label, count(*) n
    from (select distinct on (session_id) * from site_events where event = 'pageview' and created_at >= since order by session_id, created_at) f
    group by 1 order by 2 desc limit 10
  ) s;
  r := r || jsonb_build_object('countries', x);

  -- Partner hubs
  select coalesce(jsonb_agg(row_to_json(h)::jsonb order by h.raised desc, h.visits desc), '[]'::jsonb) into x
  from (
    select n.hub,
      (select count(distinct session_id) from site_events where event = 'pageview' and path = '/hubs/' || n.hub and created_at >= since) as visits,
      (select count(*) from site_events where event = 'kit_click' and hub = n.hub and created_at >= since) as kit_clicks,
      (select count(distinct session_id) from site_events where hub = n.hub and created_at >= since) as tagged_sessions,
      (select count(*) from payments p where p.details ->> 'hub' = n.hub and (case when p.purpose = 'Donation' then p.amount else coalesce((p.details ->> 'extra_donation')::numeric, 0) end) > 0 and p.created_at >= since) as donation_attempts,
      (select count(*) from payments p left join contributions c on c.id = p.contribution_id
         where p.details ->> 'hub' = n.hub and (case when p.purpose = 'Donation' then p.amount else coalesce((p.details ->> 'extra_donation')::numeric, 0) end) > 0 and p.status = 'SUCCESSFUL' and coalesce(c.hidden, false) = false and p.created_at >= since) as donations_paid,
      (select coalesce(sum((case when p.purpose = 'Donation' then p.amount else coalesce((p.details ->> 'extra_donation')::numeric, 0) end)), 0) from payments p left join contributions c on c.id = p.contribution_id
         where p.details ->> 'hub' = n.hub and p.status = 'SUCCESSFUL' and coalesce(c.hidden, false) = false and p.created_at >= since) as donations_amount,
      (select count(*) from payments p where p.details ->> 'hub' = n.hub and p.purpose = 'Runner registration' and p.created_at >= since) as kit_attempts,
      (select count(*) from payments p left join contributions c on c.id = p.contribution_id
         where p.details ->> 'hub' = n.hub and p.purpose = 'Runner registration' and p.status = 'SUCCESSFUL' and coalesce(c.hidden, false) = false and p.created_at >= since) as kits_paid,
      (select coalesce(sum(p.amount - coalesce((p.details ->> 'extra_donation')::numeric, 0)), 0) from payments p left join contributions c on c.id = p.contribution_id
         where p.details ->> 'hub' = n.hub and p.purpose = 'Runner registration' and p.status = 'SUCCESSFUL' and coalesce(c.hidden, false) = false and p.created_at >= since) as kits_amount,
      (select coalesce(sum(p.amount), 0) from payments p left join contributions c on c.id = p.contribution_id
         where p.details ->> 'hub' = n.hub and p.status = 'SUCCESSFUL' and coalesce(c.hidden, false) = false and p.created_at >= since) as raised
    from (
      select details ->> 'hub' as hub from payments where details ->> 'hub' is not null
      union select hub from site_events where hub is not null
    ) n
  ) h;
  r := r || jsonb_build_object('hubs', x);

  -- Volunteer referrals (read-only view of what the GoAffPro tracking already stores)
  select coalesce(jsonb_agg(jsonb_build_object('code', code, 'payments', pc, 'paid', pa, 'enquiries', ec) order by pa desc, ec desc), '[]'::jsonb) into x
  from (
    select code, sum(pc) pc, sum(pa) pa, sum(ec) ec from (
      select p.referral_code code, count(*) pc,
             coalesce(sum(p.amount) filter (where p.status = 'SUCCESSFUL'), 0) pa, 0 ec
      from payments p where p.referral_code is not null and p.created_at >= since group by 1
      union all
      select referral_code, 0, 0, count(*) from enquiries where referral_code is not null and created_at >= since group by 1
    ) u group by code
  ) s;
  r := r || jsonb_build_object('volunteers', x);

  -- Enquiries and signed documents
  select coalesce(jsonb_agg(jsonb_build_object('type', type, 'status', status, 'count', n)), '[]'::jsonb) into x
  from (select type, status, count(*) n from enquiries where created_at >= since group by 1, 2) s;
  r := r || jsonb_build_object('enquiries', x);

  r := r || jsonb_build_object('documents', jsonb_build_object(
    'volunteer_agreements', (select count(*) from volunteer_agreements where created_at >= since),
    'partner_mous', (select count(*) from partner_mous where created_at >= since)
  ));

  -- Latest payments
  select coalesce(jsonb_agg(jsonb_build_object(
      'at', created_at, 'reference', reference, 'purpose', purpose, 'status', status, 'amount', amount,
      'name', full_name, 'method', case when details ->> 'method' = 'card' then 'card' else 'mobile' end,
      'hub', details ->> 'hub', 'category', details ->> 'category', 'referral', referral_code
    ) order by created_at desc), '[]'::jsonb) into x
  from (select * from payments order by created_at desc limit 20) s;
  r := r || jsonb_build_object('recent', x);

  r := r || jsonb_build_object('generated_at', now(), 'days', days);
  return r;
end;
$$;
revoke all on function public.analytics_report(integer) from public, anon, authenticated;
grant execute on function public.analytics_report(integer) to service_role;
