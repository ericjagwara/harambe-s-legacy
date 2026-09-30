-- Contributions can be hidden from the public board and totals without deleting them.
-- The payment records stay intact for accounting.
alter table public.contributions add column if not exists hidden boolean not null default false;

drop policy if exists "Contributions are publicly viewable" on public.contributions;
-- An older duplicate policy allowed reading every contribution, including hidden ones.
drop policy if exists "Public can view contributions" on public.contributions;
create policy "Contributions are publicly viewable"
on public.contributions for select
using (not hidden);

-- The team's own test donations (real money, UGX 4,500 in total), made while setting up payments.
update public.contributions set hidden = true
where id in (
  'abcf733c-73a6-4810-b74d-80745251a0fc',
  '9280c749-4ece-4075-bc79-a8ca12a1973f',
  'ea976302-2bd7-4efa-87f0-6f545f41c051',
  '3f5b4edb-8d0c-4275-90e7-c8f6994985b3',
  '4a8be94b-3210-4f64-addc-663136ae6483'
);
