create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  title text not null,
  body text not null,
  kind text not null default 'in_app',
  notification_type text not null default 'general',
  feed_item_id text,
  feed_item_type text,
  href text,
  read_at timestamptz,
  scheduled_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications
  add column if not exists actor_id uuid references public.profiles(id) on delete set null,
  add column if not exists notification_type text not null default 'general',
  add column if not exists feed_item_id text,
  add column if not exists feed_item_type text,
  add column if not exists href text,
  add column if not exists read_at timestamptz,
  add column if not exists scheduled_at timestamptz;

create index if not exists notifications_user_created_idx
  on public.notifications(user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications(user_id, read_at)
  where read_at is null;

create index if not exists notifications_feed_item_idx
  on public.notifications(feed_item_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications own read" on public.notifications;
create policy "notifications own read"
  on public.notifications
  for select
  using (user_id = auth.uid());

drop policy if exists "notifications own insert" on public.notifications;
create policy "notifications own insert"
  on public.notifications
  for insert
  with check (user_id = auth.uid() or actor_id = auth.uid());

drop policy if exists "notifications own update" on public.notifications;
create policy "notifications own update"
  on public.notifications
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "notifications own delete" on public.notifications;
create policy "notifications own delete"
  on public.notifications
  for delete
  using (user_id = auth.uid());
