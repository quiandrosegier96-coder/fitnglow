insert into public.profiles (id, email, full_name, welcome_completed)
select id, email, 'Fit & Glow Admin', true
from auth.users
where lower(email) = 'fitandglow.joyce@gmail.com'
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  welcome_completed = true;

insert into public.roles (user_id, role)
select id, 'administrator'::public.app_role
from auth.users
where lower(email) = 'fitandglow.joyce@gmail.com'
on conflict (user_id, role) do nothing;

create or replace function public.is_daily_challenge_uploader()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt()->>'email', '')) = 'fitandglow.joyce@gmail.com';
$$;

drop policy if exists "authenticated daily challenge media upload" on storage.objects;
drop policy if exists "authenticated daily challenge media update" on storage.objects;
drop policy if exists "authenticated daily challenge media delete" on storage.objects;
drop policy if exists "staff daily challenge media upload" on storage.objects;
drop policy if exists "staff daily challenge media update" on storage.objects;
drop policy if exists "staff daily challenge media delete" on storage.objects;
drop policy if exists "admin daily challenge media upload" on storage.objects;
drop policy if exists "admin daily challenge media update" on storage.objects;
drop policy if exists "admin daily challenge media delete" on storage.objects;
drop policy if exists "only joyce daily challenge media upload" on storage.objects;
drop policy if exists "only joyce daily challenge media update" on storage.objects;
drop policy if exists "only joyce daily challenge media delete" on storage.objects;

create policy "only joyce daily challenge media upload"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'daily-challenges' and public.is_daily_challenge_uploader());

create policy "only joyce daily challenge media update"
on storage.objects
for update
to authenticated
using (bucket_id = 'daily-challenges' and public.is_daily_challenge_uploader())
with check (bucket_id = 'daily-challenges' and public.is_daily_challenge_uploader());

create policy "only joyce daily challenge media delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'daily-challenges' and public.is_daily_challenge_uploader());

drop policy if exists "daily challenges authenticated write" on public.daily_challenges;
drop policy if exists "daily challenges staff write" on public.daily_challenges;
drop policy if exists "daily challenges admin write" on public.daily_challenges;
drop policy if exists "daily challenges only joyce write" on public.daily_challenges;
drop policy if exists "daily challenges only joyce insert" on public.daily_challenges;
drop policy if exists "daily challenges only joyce update" on public.daily_challenges;
drop policy if exists "daily challenges only joyce delete" on public.daily_challenges;

drop policy if exists "published daily challenges read" on public.daily_challenges;
drop policy if exists "daily challenges public read" on public.daily_challenges;

create policy "published daily challenges read"
on public.daily_challenges
for select
to authenticated
using (
  public.is_daily_challenge_uploader()
  or (
    is_published = true
    and challenge_date <= (now() at time zone 'Europe/Brussels')::date
  )
);

create policy "daily challenges only joyce insert"
on public.daily_challenges
for insert
to authenticated
with check (public.is_daily_challenge_uploader());

create policy "daily challenges only joyce update"
on public.daily_challenges
for update
to authenticated
using (public.is_daily_challenge_uploader())
with check (public.is_daily_challenge_uploader());

create policy "daily challenges only joyce delete"
on public.daily_challenges
for delete
to authenticated
using (public.is_daily_challenge_uploader());
