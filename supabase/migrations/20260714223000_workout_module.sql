create table if not exists public.workout_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workouts add column if not exists category_id uuid references public.workout_categories(id) on delete set null;
alter table public.workouts add column if not exists estimated_calories int not null default 0;
alter table public.workouts add column if not exists coach_name text;
alter table public.workouts add column if not exists equipment text[] not null default '{}';
alter table public.workouts add column if not exists muscle_groups text[] not null default '{}';
alter table public.workouts add column if not exists slug text;

alter table public.exercises add column if not exists description text;
alter table public.exercises add column if not exists video_url text;
alter table public.exercises add column if not exists notes text;

alter table public.workout_exercises add column if not exists weight text;
alter table public.workout_exercises add column if not exists notes text;

create table if not exists public.completed_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workout_id uuid not null references public.workouts(id) on delete cascade,
  duration_minutes numeric(6,2) not null,
  calories numeric(7,2) not null,
  completion_percentage numeric(5,2) not null check (completion_percentage >= 0 and completion_percentage <= 100),
  average_pace text not null,
  personal_notes text,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.favorite_workouts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  workout_id uuid not null references public.workouts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, workout_id)
);

create table if not exists public.exercise_media (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  media_id uuid not null references public.media(id) on delete cascade,
  purpose text not null check (purpose in ('cover', 'gif', 'video', 'attachment')),
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.exercise_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workout_id uuid references public.workouts(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (workout_id is not null or exercise_id is not null)
);

create table if not exists public.exercise_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workout_id uuid references public.workouts(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete cascade,
  rating numeric(2,1) not null check (rating >= 1 and rating <= 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (workout_id is not null or exercise_id is not null),
  unique (user_id, workout_id, exercise_id)
);

create unique index if not exists workouts_slug_idx on public.workouts(slug) where slug is not null;
create index if not exists workouts_category_idx on public.workouts(category_id, is_published);
create index if not exists workouts_search_idx on public.workouts using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(coach_name, '')));
create index if not exists completed_workouts_user_date_idx on public.completed_workouts(user_id, completed_at desc);
create index if not exists favorite_workouts_user_idx on public.favorite_workouts(user_id, created_at desc);
create index if not exists exercise_media_exercise_idx on public.exercise_media(exercise_id, position);
create index if not exists exercise_comments_workout_idx on public.exercise_comments(workout_id, created_at desc);
create index if not exists exercise_ratings_workout_idx on public.exercise_ratings(workout_id, rating);

alter table public.workout_categories enable row level security;
alter table public.completed_workouts enable row level security;
alter table public.favorite_workouts enable row level security;
alter table public.exercise_media enable row level security;
alter table public.exercise_comments enable row level security;
alter table public.exercise_ratings enable row level security;

drop trigger if exists workout_categories_touch on public.workout_categories;
create trigger workout_categories_touch before update on public.workout_categories for each row execute function public.touch_updated_at();
drop trigger if exists exercise_comments_touch on public.exercise_comments;
create trigger exercise_comments_touch before update on public.exercise_comments for each row execute function public.touch_updated_at();
drop trigger if exists exercise_ratings_touch on public.exercise_ratings;
create trigger exercise_ratings_touch before update on public.exercise_ratings for each row execute function public.touch_updated_at();

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'workout_categories' and policyname = 'workout_categories read') then
    create policy "workout_categories read" on public.workout_categories for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'workout_categories' and policyname = 'staff workout_categories write') then
    create policy "staff workout_categories write" on public.workout_categories for all using (public.is_staff()) with check (public.is_staff());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'completed_workouts' and policyname = 'completed_workouts own or staff') then
    create policy "completed_workouts own or staff" on public.completed_workouts for all using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'favorite_workouts' and policyname = 'favorite_workouts own') then
    create policy "favorite_workouts own" on public.favorite_workouts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'exercise_media' and policyname = 'exercise_media read') then
    create policy "exercise_media read" on public.exercise_media for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'exercise_media' and policyname = 'staff exercise_media write') then
    create policy "staff exercise_media write" on public.exercise_media for all using (public.is_staff()) with check (public.is_staff());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'exercise_comments' and policyname = 'exercise_comments read') then
    create policy "exercise_comments read" on public.exercise_comments for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'exercise_comments' and policyname = 'exercise_comments own write') then
    create policy "exercise_comments own write" on public.exercise_comments for all using (user_id = auth.uid() or public.has_role('administrator')) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'exercise_ratings' and policyname = 'exercise_ratings read') then
    create policy "exercise_ratings read" on public.exercise_ratings for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'exercise_ratings' and policyname = 'exercise_ratings own') then
    create policy "exercise_ratings own" on public.exercise_ratings for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;

insert into public.workout_categories (name, slug, description)
values
  ('Sculpt', 'sculpt', 'Toning and strength-focused sessions.'),
  ('Strength', 'strength', 'Progressive resistance workouts.'),
  ('Pilates', 'pilates', 'Controlled core and posture sessions.'),
  ('HIIT', 'hiit', 'Conditioning and calorie-burning sessions.'),
  ('Mobility', 'mobility', 'Joint-friendly mobility and flexibility.'),
  ('Recovery', 'recovery', 'Low-intensity restorative workouts.')
on conflict (slug) do nothing;
