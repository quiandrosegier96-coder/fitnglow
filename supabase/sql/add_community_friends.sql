create table if not exists public.community_friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz,
  constraint community_friendships_no_self check (requester_id <> addressee_id),
  constraint community_friendships_unique_pair unique (requester_id, addressee_id)
);

create index if not exists community_friendships_requester_idx
  on public.community_friendships(requester_id, status);

create index if not exists community_friendships_addressee_idx
  on public.community_friendships(addressee_id, status);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists community_friendships_touch on public.community_friendships;
create trigger community_friendships_touch
before update on public.community_friendships
for each row execute function public.touch_updated_at();

alter table public.community_friendships enable row level security;

drop policy if exists "community friendships own read" on public.community_friendships;
create policy "community friendships own read"
  on public.community_friendships
  for select
  using (requester_id = auth.uid() or addressee_id = auth.uid());

drop policy if exists "community friendships create request" on public.community_friendships;
create policy "community friendships create request"
  on public.community_friendships
  for insert
  with check (requester_id = auth.uid() and requester_id <> addressee_id);

drop policy if exists "community friendships accept own request" on public.community_friendships;
create policy "community friendships accept own request"
  on public.community_friendships
  for update
  using (addressee_id = auth.uid() or requester_id = auth.uid())
  with check (addressee_id = auth.uid() or requester_id = auth.uid());

drop policy if exists "community friendships delete own" on public.community_friendships;
create policy "community friendships delete own"
  on public.community_friendships
  for delete
  using (requester_id = auth.uid() or addressee_id = auth.uid());

drop policy if exists "profiles community discover read" on public.profiles;
create policy "profiles community discover read"
  on public.profiles
  for select
  using (auth.uid() is not null);

do $$
begin
  if to_regclass('public.body_profiles') is not null then
    drop policy if exists "body profiles friends read" on public.body_profiles;
    create policy "body profiles friends read"
      on public.body_profiles
      for select
      using (
        user_id = auth.uid()
        or exists (
          select 1
          from public.community_friendships f
          where f.status = 'accepted'
            and (
              (f.requester_id = auth.uid() and f.addressee_id = public.body_profiles.user_id)
              or (f.addressee_id = auth.uid() and f.requester_id = public.body_profiles.user_id)
            )
        )
      );
  end if;

  if to_regclass('public.community_posts') is not null then
    drop policy if exists "community posts friends read" on public.community_posts;
    create policy "community posts friends read"
      on public.community_posts
      for select
      using (
        user_id = auth.uid()
        or exists (
          select 1
          from public.community_friendships f
          where f.status = 'accepted'
            and (
              (f.requester_id = auth.uid() and f.addressee_id = public.community_posts.user_id)
              or (f.addressee_id = auth.uid() and f.requester_id = public.community_posts.user_id)
            )
        )
      );
  end if;

  if to_regclass('public.strava_activities') is not null then
    drop policy if exists "strava activities friends read" on public.strava_activities;
    create policy "strava activities friends read"
      on public.strava_activities
      for select
      using (
        user_id = auth.uid()
        or exists (
          select 1
          from public.community_friendships f
          where f.status = 'accepted'
            and (
              (f.requester_id = auth.uid() and f.addressee_id = public.strava_activities.user_id)
              or (f.addressee_id = auth.uid() and f.requester_id = public.strava_activities.user_id)
            )
        )
      );
  end if;

  if to_regclass('public.completed_workouts') is not null then
    drop policy if exists "completed workouts friends read" on public.completed_workouts;
    create policy "completed workouts friends read"
      on public.completed_workouts
      for select
      using (
        user_id = auth.uid()
        or exists (
          select 1
          from public.community_friendships f
          where f.status = 'accepted'
            and (
              (f.requester_id = auth.uid() and f.addressee_id = public.completed_workouts.user_id)
              or (f.addressee_id = auth.uid() and f.requester_id = public.completed_workouts.user_id)
            )
        )
      );
  end if;

  if to_regclass('public.daily_challenge_completions') is not null then
    drop policy if exists "daily challenge completions friends read" on public.daily_challenge_completions;
    create policy "daily challenge completions friends read"
      on public.daily_challenge_completions
      for select
      using (
        user_id = auth.uid()
        or exists (
          select 1
          from public.community_friendships f
          where f.status = 'accepted'
            and (
              (f.requester_id = auth.uid() and f.addressee_id = public.daily_challenge_completions.user_id)
              or (f.addressee_id = auth.uid() and f.requester_id = public.daily_challenge_completions.user_id)
            )
        )
      );
  end if;
end $$;
