create extension if not exists "pgcrypto";

create type public.app_role as enum ('user', 'coach', 'administrator');
create type public.difficulty as enum ('beginner', 'intermediate', 'advanced');
create type public.notification_channel as enum ('push', 'email', 'in_app');
create type public.media_type as enum ('image', 'video', 'attachment');

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  avatar_url text,
  email text,
  goal text,
  date_of_birth date,
  height_cm numeric(6,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  type public.media_type not null,
  bucket text not null,
  path text not null,
  alt text,
  width int,
  height int,
  duration_seconds int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  instructions text not null,
  muscle_group text not null,
  difficulty public.difficulty not null,
  animated_media_id uuid references public.media(id),
  video_media_id uuid references public.media(id),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  difficulty public.difficulty not null,
  duration_minutes int not null check (duration_minutes > 0),
  cover_media_id uuid references public.media(id),
  video_media_id uuid references public.media(id),
  attachment_media_id uuid references public.media(id),
  is_published boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workout_exercises (
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  position int not null,
  sets int not null check (sets > 0),
  reps text not null,
  rest_seconds int not null default 60,
  primary key (workout_id, exercise_id)
);

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('breakfast', 'lunch', 'dinner', 'snacks', 'smoothies', 'desserts')),
  preparation text not null,
  ingredients jsonb not null default '[]',
  calories int not null check (calories >= 0),
  protein numeric(6,2) not null default 0,
  carbs numeric(6,2) not null default 0,
  fat numeric(6,2) not null default 0,
  preparation_minutes int not null,
  cover_media_id uuid references public.media(id),
  is_published boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.nutrition_plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  calories_target int not null,
  shopping_list jsonb not null default '[]',
  is_published boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.nutrition_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.nutrition_plans(id) on delete cascade,
  day_index int not null,
  meal_name text not null,
  meal_time time not null,
  recipe_id uuid references public.recipes(id) on delete set null,
  calories int,
  unique (plan_id, day_index, meal_name)
);

create table public.tips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category text not null check (category in ('fitness', 'sleep', 'hydration', 'mindset', 'recovery', 'stress', 'motivation')),
  publish_date date not null,
  is_published boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  body_fat numeric(5,2),
  waist numeric(6,2),
  chest numeric(6,2),
  arms numeric(6,2),
  legs numeric(6,2),
  photo_media_id uuid references public.media(id),
  note text,
  measured_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  weight_kg numeric(6,2) not null check (weight_kg > 0),
  logged_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  kind public.notification_channel not null,
  scheduled_at timestamptz,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  current_count int not null default 0,
  longest_count int not null default 0,
  last_completed_on date,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  icon_media_id uuid references public.media(id),
  xp_reward int not null default 0,
  created_at timestamptz not null default now()
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entity_type text not null check (entity_type in ('recipe', 'workout', 'tip', 'community_post')),
  entity_id uuid not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entity_type text not null check (entity_type in ('recipe', 'workout', 'tip')),
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, entity_type, entity_id)
);

create table public.settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  language text not null default 'en',
  theme text not null default 'system',
  push_enabled boolean not null default true,
  email_enabled boolean not null default true,
  workout_reminders boolean not null default true,
  water_reminders boolean not null default true,
  nutrition_reminders boolean not null default true,
  community_visibility text not null default 'members',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.has_role(required_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.roles
    where user_id = auth.uid() and role = required_role
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('coach') or public.has_role('administrator');
$$;

create index profiles_email_idx on public.profiles(email);
create index roles_user_role_idx on public.roles(user_id, role);
create index workouts_published_idx on public.workouts(is_published, difficulty);
create index workout_exercises_workout_idx on public.workout_exercises(workout_id, position);
create index recipes_category_idx on public.recipes(category) where is_published;
create index nutrition_days_plan_idx on public.nutrition_days(plan_id, day_index);
create index tips_publish_idx on public.tips(publish_date) where is_published;
create index progress_user_date_idx on public.progress(user_id, measured_at desc);
create index weight_logs_user_date_idx on public.weight_logs(user_id, logged_at desc);
create index notifications_user_schedule_idx on public.notifications(user_id, scheduled_at);
create index comments_entity_idx on public.comments(entity_type, entity_id, created_at desc);
create index favorites_user_idx on public.favorites(user_id, entity_type);
create index media_owner_idx on public.media(owner_id, type);

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger media_touch before update on public.media for each row execute function public.touch_updated_at();
create trigger exercises_touch before update on public.exercises for each row execute function public.touch_updated_at();
create trigger workouts_touch before update on public.workouts for each row execute function public.touch_updated_at();
create trigger recipes_touch before update on public.recipes for each row execute function public.touch_updated_at();
create trigger nutrition_plans_touch before update on public.nutrition_plans for each row execute function public.touch_updated_at();
create trigger tips_touch before update on public.tips for each row execute function public.touch_updated_at();
create trigger progress_touch before update on public.progress for each row execute function public.touch_updated_at();
create trigger comments_touch before update on public.comments for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.settings for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.media enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.recipes enable row level security;
alter table public.nutrition_plans enable row level security;
alter table public.nutrition_days enable row level security;
alter table public.tips enable row level security;
alter table public.progress enable row level security;
alter table public.weight_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.streaks enable row level security;
alter table public.badges enable row level security;
alter table public.achievements enable row level security;
alter table public.comments enable row level security;
alter table public.favorites enable row level security;
alter table public.settings enable row level security;

create policy "profiles own or staff read" on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy "profiles own update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "roles own read" on public.roles for select using (user_id = auth.uid() or public.has_role('administrator'));
create policy "roles administrator write" on public.roles for all using (public.has_role('administrator')) with check (public.has_role('administrator'));
create policy "media read" on public.media for select using (true);
create policy "media own or staff write" on public.media for all using (owner_id = auth.uid() or public.is_staff()) with check (owner_id = auth.uid() or public.is_staff());
create policy "published workouts read" on public.workouts for select using (is_published or public.is_staff());
create policy "staff workouts write" on public.workouts for all using (public.is_staff()) with check (public.is_staff());
create policy "exercises read" on public.exercises for select using (true);
create policy "staff exercises write" on public.exercises for all using (public.is_staff()) with check (public.is_staff());
create policy "workout_exercises read" on public.workout_exercises for select using (true);
create policy "staff workout_exercises write" on public.workout_exercises for all using (public.is_staff()) with check (public.is_staff());
create policy "published recipes read" on public.recipes for select using (is_published or public.is_staff());
create policy "staff recipes write" on public.recipes for all using (public.is_staff()) with check (public.is_staff());
create policy "published nutrition read" on public.nutrition_plans for select using (is_published or public.is_staff());
create policy "staff nutrition write" on public.nutrition_plans for all using (public.is_staff()) with check (public.is_staff());
create policy "nutrition_days read" on public.nutrition_days for select using (true);
create policy "staff nutrition_days write" on public.nutrition_days for all using (public.is_staff()) with check (public.is_staff());
create policy "published tips read" on public.tips for select using (is_published or public.is_staff());
create policy "staff tips write" on public.tips for all using (public.is_staff()) with check (public.is_staff());
create policy "progress own or staff" on public.progress for all using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid());
create policy "weight_logs own or staff" on public.weight_logs for all using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid());
create policy "notifications own or staff" on public.notifications for all using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_staff());
create policy "streaks own or staff" on public.streaks for all using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_staff());
create policy "badges read" on public.badges for select using (true);
create policy "badges administrator write" on public.badges for all using (public.has_role('administrator')) with check (public.has_role('administrator'));
create policy "achievements own or staff read" on public.achievements for select using (user_id = auth.uid() or public.is_staff());
create policy "achievements staff write" on public.achievements for all using (public.is_staff()) with check (public.is_staff());
create policy "comments read" on public.comments for select using (true);
create policy "comments own write" on public.comments for all using (user_id = auth.uid() or public.has_role('administrator')) with check (user_id = auth.uid());
create policy "favorites own" on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "settings own" on public.settings for all using (user_id = auth.uid() or public.has_role('administrator')) with check (user_id = auth.uid());
