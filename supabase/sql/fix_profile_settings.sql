create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Fit & Glow Member',
  avatar_url text,
  email text,
  goal text,
  date_of_birth date,
  height_cm numeric(6,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists full_name text not null default 'Fit & Glow Member',
  add column if not exists avatar_url text,
  add column if not exists email text,
  add column if not exists goal text,
  add column if not exists date_of_birth date,
  add column if not exists height_cm numeric(6,2),
  add column if not exists updated_at timestamptz not null default now();

alter table public.profiles enable row level security;

drop policy if exists "profiles own select" on public.profiles;
create policy "profiles own select"
  on public.profiles
  for select
  using (id = auth.uid());

drop policy if exists "profiles own insert" on public.profiles;
create policy "profiles own insert"
  on public.profiles
  for insert
  with check (id = auth.uid());

drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 4194304, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
set public = true,
    file_size_limit = 4194304,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read"
  on storage.objects
  for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars own insert" on storage.objects;
create policy "avatars own insert"
  on storage.objects
  for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
  );

drop policy if exists "avatars own update" on storage.objects;
create policy "avatars own update"
  on storage.objects
  for update
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
  )
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
  );

drop policy if exists "avatars own delete" on storage.objects;
create policy "avatars own delete"
  on storage.objects
  for delete
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
  );
