create table if not exists public.motivational_quotes (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source text not null check (source in ('workout', 'weight_log', 'meal_log', 'challenge', 'daily_login', 'achievement')),
  source_id uuid,
  xp int not null check (xp > 0),
  created_at timestamptz not null default now()
);

alter table public.badges add column if not exists code text;
alter table public.achievements add column if not exists progress_percentage numeric(5,2) not null default 100;

create unique index if not exists badges_code_idx on public.badges(code) where code is not null;
create index if not exists user_xp_events_user_date_idx on public.user_xp_events(user_id, created_at desc);
create index if not exists motivational_quotes_active_idx on public.motivational_quotes(is_active);
create index if not exists completed_workouts_user_completed_idx on public.completed_workouts(user_id, completed_at desc);

alter table public.motivational_quotes enable row level security;
alter table public.user_xp_events enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'motivational_quotes' and policyname = 'motivational_quotes read active') then
    create policy "motivational_quotes read active" on public.motivational_quotes for select using (is_active = true or public.is_staff());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'motivational_quotes' and policyname = 'staff motivational_quotes write') then
    create policy "staff motivational_quotes write" on public.motivational_quotes for all using (public.is_staff()) with check (public.is_staff());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_xp_events' and policyname = 'user_xp_events own or staff') then
    create policy "user_xp_events own or staff" on public.user_xp_events for all using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_staff());
  end if;
end $$;

insert into public.motivational_quotes (body)
values
  ('Your next honest action is enough to restart momentum.'),
  ('Progress becomes visible when care becomes consistent.'),
  ('Train for the woman you are becoming, not the version you are judging.'),
  ('Small precise actions become visible progress.'),
  ('Today, choose rhythm over pressure.'),
  ('You do not need perfect energy to keep a promise to yourself.'),
  ('Strong is built quietly before it is seen clearly.')
on conflict do nothing;

insert into public.badges (code, title, description, xp)
values
  ('first_workout', 'First Workout', 'Complete your first workout.', 100),
  ('streak_7', '7-Day Streak', 'Complete workouts across seven consecutive days.', 250),
  ('streak_30', '30-Day Streak', 'Complete workouts across thirty consecutive days.', 1000),
  ('lost_5kg', 'Lost 5 kg', 'Lose five kilograms from your starting weight.', 400),
  ('lost_10kg', 'Lost 10 kg', 'Lose ten kilograms from your starting weight.', 800),
  ('logged_100_meals', 'Logged 100 Meals', 'Log one hundred meals.', 500),
  ('completed_50_workouts', 'Completed 50 Workouts', 'Complete fifty workouts.', 750),
  ('water_30_days', 'Drink Water 30 Days', 'Log water intake on thirty unique days.', 350)
on conflict (code) do nothing;
