create table if not exists public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  coach_name text not null default 'Joyce',
  challenge_date date not null,
  video_url text not null,
  thumbnail_url text,
  duration_minutes int check (duration_minutes is null or duration_minutes between 1 and 240),
  is_published boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (challenge_date)
);

create index if not exists daily_challenges_date_idx
on public.daily_challenges(challenge_date desc)
where is_published = true;

alter table public.daily_challenges enable row level security;

drop trigger if exists daily_challenges_touch on public.daily_challenges;
create trigger daily_challenges_touch
before update on public.daily_challenges
for each row execute function public.touch_updated_at();

drop policy if exists "published daily challenges read" on public.daily_challenges;
create policy "published daily challenges read"
on public.daily_challenges
for select using (is_published = true or public.is_staff());

drop policy if exists "staff daily challenges write" on public.daily_challenges;
create policy "staff daily challenges write"
on public.daily_challenges
for all using (public.is_staff())
with check (public.is_staff());

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
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "daily challenge media public read" on storage.objects;
create policy "daily challenge media public read"
on storage.objects
for select using (bucket_id = 'daily-challenges');

drop policy if exists "staff daily challenge media upload" on storage.objects;
create policy "staff daily challenge media upload"
on storage.objects
for insert with check (bucket_id = 'daily-challenges' and public.is_staff());

drop policy if exists "staff daily challenge media update" on storage.objects;
create policy "staff daily challenge media update"
on storage.objects
for update using (bucket_id = 'daily-challenges' and public.is_staff())
with check (bucket_id = 'daily-challenges' and public.is_staff());

drop policy if exists "staff daily challenge media delete" on storage.objects;
create policy "staff daily challenge media delete"
on storage.objects
for delete using (bucket_id = 'daily-challenges' and public.is_staff());
