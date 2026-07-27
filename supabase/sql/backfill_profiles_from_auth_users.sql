create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  welcome_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
before update on public.profiles
for each row execute function public.touch_updated_at();

insert into public.profiles (id, email, full_name)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'full_name', email, 'Fit & Glow Member')
from auth.users
on conflict (id) do update
set
  email = excluded.email,
  full_name = coalesce(public.profiles.full_name, excluded.full_name);

alter table public.profiles enable row level security;

drop policy if exists "profiles own select" on public.profiles;
create policy "profiles own select"
on public.profiles
for select using (id = auth.uid());

drop policy if exists "profiles own insert" on public.profiles;
create policy "profiles own insert"
on public.profiles
for insert with check (id = auth.uid());

drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update"
on public.profiles
for update using (id = auth.uid())
with check (id = auth.uid());
