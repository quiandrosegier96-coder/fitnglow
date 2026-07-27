-- Run once in the Supabase SQL Editor.
create table if not exists public.grow_with_jo_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  youtube_url text not null,
  youtube_video_id text not null check (youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
  duration_minutes int check (duration_minutes is null or duration_minutes between 1 and 300),
  is_published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.grow_with_jo_videos
add column if not exists duration_minutes int;

create index if not exists grow_with_jo_published_idx on public.grow_with_jo_videos(is_published, created_at desc);
alter table public.grow_with_jo_videos enable row level security;

drop policy if exists "grow with jo authenticated read" on public.grow_with_jo_videos;
drop policy if exists "grow with jo joyce insert" on public.grow_with_jo_videos;
drop policy if exists "grow with jo joyce update" on public.grow_with_jo_videos;
drop policy if exists "grow with jo joyce delete" on public.grow_with_jo_videos;

create policy "grow with jo authenticated read" on public.grow_with_jo_videos
for select to authenticated using (is_published = true or lower(coalesce(auth.jwt()->>'email', '')) = 'fitandglow.joyce@gmail.com');
create policy "grow with jo joyce insert" on public.grow_with_jo_videos
for insert to authenticated with check (lower(coalesce(auth.jwt()->>'email', '')) = 'fitandglow.joyce@gmail.com');
create policy "grow with jo joyce update" on public.grow_with_jo_videos
for update to authenticated using (lower(coalesce(auth.jwt()->>'email', '')) = 'fitandglow.joyce@gmail.com')
with check (lower(coalesce(auth.jwt()->>'email', '')) = 'fitandglow.joyce@gmail.com');
create policy "grow with jo joyce delete" on public.grow_with_jo_videos
for delete to authenticated using (lower(coalesce(auth.jwt()->>'email', '')) = 'fitandglow.joyce@gmail.com');

create table if not exists public.grow_with_jo_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references public.grow_with_jo_videos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

alter table public.grow_with_jo_favorites enable row level security;
drop policy if exists "grow with jo favorites own read" on public.grow_with_jo_favorites;
drop policy if exists "grow with jo favorites own insert" on public.grow_with_jo_favorites;
drop policy if exists "grow with jo favorites own delete" on public.grow_with_jo_favorites;
create policy "grow with jo favorites own read" on public.grow_with_jo_favorites
for select to authenticated using (
  user_id = auth.uid()
  or exists (
    select 1 from public.community_friendships friendship
    where friendship.status = 'accepted'
      and (
        (friendship.requester_id = auth.uid() and friendship.addressee_id = grow_with_jo_favorites.user_id)
        or (friendship.addressee_id = auth.uid() and friendship.requester_id = grow_with_jo_favorites.user_id)
      )
  )
);
create policy "grow with jo favorites own insert" on public.grow_with_jo_favorites
for insert to authenticated with check (user_id = auth.uid());
create policy "grow with jo favorites own delete" on public.grow_with_jo_favorites
for delete to authenticated using (user_id = auth.uid());

create table if not exists public.content_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('grow_with_jo', 'daily_challenge')),
  item_id uuid not null,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);

create index if not exists content_ratings_item_idx on public.content_ratings(item_type, item_id);
alter table public.content_ratings enable row level security;
drop policy if exists "content ratings authenticated read" on public.content_ratings;
drop policy if exists "content ratings own insert" on public.content_ratings;
drop policy if exists "content ratings own update" on public.content_ratings;
create policy "content ratings authenticated read" on public.content_ratings
for select to authenticated using (true);
create policy "content ratings own insert" on public.content_ratings
for insert to authenticated with check (user_id = auth.uid());
create policy "content ratings own update" on public.content_ratings
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.grow_with_jo_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references public.grow_with_jo_videos(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

alter table public.grow_with_jo_completions enable row level security;
drop policy if exists "grow with jo completions own read" on public.grow_with_jo_completions;
drop policy if exists "grow with jo completions own insert" on public.grow_with_jo_completions;
drop policy if exists "grow with jo completions own delete" on public.grow_with_jo_completions;
create policy "grow with jo completions own read" on public.grow_with_jo_completions
for select to authenticated using (user_id = auth.uid());
create policy "grow with jo completions own insert" on public.grow_with_jo_completions
for insert to authenticated with check (user_id = auth.uid());
create policy "grow with jo completions own delete" on public.grow_with_jo_completions
for delete to authenticated using (user_id = auth.uid());

create table if not exists public.content_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('daily_challenge')),
  item_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);
alter table public.content_favorites enable row level security;
drop policy if exists "content favorites own read" on public.content_favorites;
drop policy if exists "content favorites own insert" on public.content_favorites;
drop policy if exists "content favorites own delete" on public.content_favorites;
create policy "content favorites own read" on public.content_favorites for select to authenticated using (user_id = auth.uid());
create policy "content favorites own insert" on public.content_favorites for insert to authenticated with check (user_id = auth.uid());
create policy "content favorites own delete" on public.content_favorites for delete to authenticated using (user_id = auth.uid());

create table if not exists public.content_history (
  user_id uuid not null references auth.users(id) on delete cascade,
  content_type text not null check (content_type in ('grow_with_jo', 'recipe')),
  content_id text not null,
  title text not null,
  image_url text,
  first_viewed_at timestamptz not null default now(),
  last_viewed_at timestamptz not null default now(),
  primary key (user_id, content_type, content_id)
);
alter table public.content_history enable row level security;
drop policy if exists "content history own read" on public.content_history;
drop policy if exists "content history own insert" on public.content_history;
drop policy if exists "content history own update" on public.content_history;
create policy "content history own read" on public.content_history for select to authenticated using (user_id = auth.uid());
create policy "content history own insert" on public.content_history for insert to authenticated with check (user_id = auth.uid());
create policy "content history own update" on public.content_history for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
