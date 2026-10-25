-- Unique-visitor counting by IP address. Only a keyed hash of the IP is stored (see site-insights), never the address.
alter table public.site_events add column if not exists ip_hash text;
create index if not exists site_events_ip_hash_idx on public.site_events (ip_hash) where ip_hash is not null;
-- analytics_report now wraps analytics_report_base and adds unique_ips to traffic, daily and hubs
-- (applied live as migration analytics_unique_ips).
