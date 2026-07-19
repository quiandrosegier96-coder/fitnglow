create extension if not exists "pgcrypto";

create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric(6,2) not null,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint weight_logs_weight_kg_check check (weight_kg >= 25 and weight_kg <= 350)
);

create index if not exists weight_logs_latest_user_idx
  on public.weight_logs(user_id, logged_at desc);

alter table public.weight_logs enable row level security;

drop policy if exists "weight_logs own read" on public.weight_logs;
create policy "weight_logs own read"
  on public.weight_logs
  for select
  using (user_id = auth.uid());

drop policy if exists "weight_logs own insert" on public.weight_logs;
create policy "weight_logs own insert"
  on public.weight_logs
  for insert
  with check (user_id = auth.uid());

drop policy if exists "weight_logs own update" on public.weight_logs;
create policy "weight_logs own update"
  on public.weight_logs
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "weight_logs own delete" on public.weight_logs;
create policy "weight_logs own delete"
  on public.weight_logs
  for delete
  using (user_id = auth.uid());
