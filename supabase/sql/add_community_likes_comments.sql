create table if not exists public.community_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  feed_item_id text not null,
  feed_item_type text not null check (feed_item_type in ('post', 'strava', 'workout', 'challenge')),
  reaction_type text not null default 'like' check (reaction_type in ('like')),
  created_at timestamptz not null default now(),
  constraint community_reactions_unique_like unique (user_id, feed_item_id, reaction_type)
);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_comment_id uuid references public.community_comments(id) on delete cascade,
  feed_item_id text not null,
  feed_item_type text not null check (feed_item_type in ('post', 'strava', 'workout', 'challenge')),
  body text not null check (char_length(trim(body)) >= 1 and char_length(body) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.community_comments
  add column if not exists parent_comment_id uuid references public.community_comments(id) on delete cascade;

create index if not exists community_reactions_feed_idx
  on public.community_reactions(feed_item_id, reaction_type, created_at desc);

create index if not exists community_reactions_user_idx
  on public.community_reactions(user_id, created_at desc);

create index if not exists community_comments_feed_idx
  on public.community_comments(feed_item_id, parent_comment_id, created_at asc);

create index if not exists community_comments_user_idx
  on public.community_comments(user_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists community_comments_touch on public.community_comments;
create trigger community_comments_touch
before update on public.community_comments
for each row execute function public.touch_updated_at();

alter table public.community_reactions enable row level security;
alter table public.community_comments enable row level security;

drop policy if exists "community reactions authenticated read" on public.community_reactions;
create policy "community reactions authenticated read"
  on public.community_reactions
  for select
  using (auth.uid() is not null);

drop policy if exists "community reactions own insert" on public.community_reactions;
create policy "community reactions own insert"
  on public.community_reactions
  for insert
  with check (user_id = auth.uid());

drop policy if exists "community reactions own delete" on public.community_reactions;
create policy "community reactions own delete"
  on public.community_reactions
  for delete
  using (user_id = auth.uid());

drop policy if exists "community comments authenticated read" on public.community_comments;
create policy "community comments authenticated read"
  on public.community_comments
  for select
  using (auth.uid() is not null);

drop policy if exists "community comments own insert" on public.community_comments;
create policy "community comments own insert"
  on public.community_comments
  for insert
  with check (user_id = auth.uid());

drop policy if exists "community comments own update" on public.community_comments;
create policy "community comments own update"
  on public.community_comments
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "community comments own delete" on public.community_comments;
create policy "community comments own delete"
  on public.community_comments
  for delete
  using (user_id = auth.uid());
