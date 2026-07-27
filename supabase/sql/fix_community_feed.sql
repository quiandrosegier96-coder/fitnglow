create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_posts_user_date_idx
  on public.community_posts(user_id, created_at desc);

alter table public.community_posts enable row level security;

drop policy if exists "community posts own read" on public.community_posts;
create policy "community posts own read"
  on public.community_posts
  for select
  using (user_id = auth.uid());

drop policy if exists "community posts own insert" on public.community_posts;
create policy "community posts own insert"
  on public.community_posts
  for insert
  with check (user_id = auth.uid());

drop policy if exists "community posts own update" on public.community_posts;
create policy "community posts own update"
  on public.community_posts
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "community posts own delete" on public.community_posts;
create policy "community posts own delete"
  on public.community_posts
  for delete
  using (user_id = auth.uid());
