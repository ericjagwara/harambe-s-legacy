-- Logos uploaded by Startup/SME runners. Private: the public can upload images only;
-- nobody outside the team can list, view, replace or delete them.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('startup-logos', 'startup-logos', false, 2097152, array['image/png','image/jpeg','image/webp','image/svg+xml'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can upload a startup logo" on storage.objects;
create policy "Anyone can upload a startup logo" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'startup-logos' and name ~ '^[0-9a-f-]{36}\.(png|jpg|jpeg|webp|svg)$');
