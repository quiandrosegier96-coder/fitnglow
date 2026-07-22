create table if not exists public.strava_connections (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  athlete_id bigint not null,
  scope text not null default '',
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  athlete jsonb not null default '{}'::jsonb,
  connected_at timestamptz not null default now(),
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.strava_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  strava_activity_id bigint not null,
  name text not null,
  type text,
  sport_type text,
  distance_meters numeric(12,2),
  moving_time_seconds int,
  elapsed_time_seconds int,
  total_elevation_gain numeric(10,2),
  calories numeric(8,2),
  average_speed numeric(10,4),
  average_heartrate numeric(7,2),
  max_heartrate numeric(7,2),
  start_date timestamptz not null,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, strava_activity_id)
);

create table if not exists public.strava_oauth_states (
  state text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists strava_activities_user_date_idx on public.strava_activities(user_id, start_date desc);
create index if not exists strava_activities_type_idx on public.strava_activities(user_id, sport_type, start_date desc);
create index if not exists strava_oauth_states_expiry_idx on public.strava_oauth_states(expires_at);

alter table public.strava_connections enable row level security;
alter table public.strava_activities enable row level security;
alter table public.strava_oauth_states enable row level security;

drop trigger if exists strava_connections_touch on public.strava_connections;
create trigger strava_connections_touch before update on public.strava_connections for each row execute function public.touch_updated_at();
drop trigger if exists strava_activities_touch on public.strava_activities;
create trigger strava_activities_touch before update on public.strava_activities for each row execute function public.touch_updated_at();

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'strava_connections' and policyname = 'strava_connections own') then
    create policy "strava_connections own" on public.strava_connections for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'strava_activities' and policyname = 'strava_activities own') then
    create policy "strava_activities own" on public.strava_activities for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'strava_oauth_states' and policyname = 'strava_oauth_states own') then
    create policy "strava_oauth_states own" on public.strava_oauth_states for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;
