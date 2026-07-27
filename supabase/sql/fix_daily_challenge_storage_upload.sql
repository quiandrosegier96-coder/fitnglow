insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'daily-challenges',
  'daily-challenges',
  true,
  524288000,
  array['video/mp4', 'video/quicktime', 'video/webm', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = true,
  file_size_limit = 524288000,
  allowed_mime_types = array['video/mp4', 'video/quicktime', 'video/webm', 'image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "daily challenge media public read" on storage.objects;
drop policy if exists "staff daily challenge media upload" on storage.objects;
drop policy if exists "staff daily challenge media update" on storage.objects;
drop policy if exists "staff daily challenge media delete" on storage.objects;
drop policy if exists "authenticated daily challenge media upload" on storage.objects;
drop policy if exists "authenticated daily challenge media update" on storage.objects;
drop policy if exists "authenticated daily challenge media delete" on storage.objects;

create policy "daily challenge media public read"
on storage.objects
for select
to public
using (bucket_id = 'daily-challenges');

create policy "authenticated daily challenge media upload"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'daily-challenges');

create policy "authenticated daily challenge media update"
on storage.objects
for update
to authenticated
using (bucket_id = 'daily-challenges')
with check (bucket_id = 'daily-challenges');

create policy "authenticated daily challenge media delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'daily-challenges');
