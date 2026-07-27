create extension if not exists "pgcrypto";

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Fit & Glow Member',
  avatar_url text,
  email text,
  goal text,
  date_of_birth date,
  height_cm numeric(6,2),
  welcome_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists full_name text not null default 'Fit & Glow Member';
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists goal text;
alter table public.profiles add column if not exists date_of_birth date;
alter table public.profiles add column if not exists height_cm numeric(6,2);
alter table public.profiles add column if not exists welcome_completed boolean not null default false;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.body_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  gender text not null default 'female',
  date_of_birth date,
  age int,
  country text not null default '',
  preferred_language text not null default 'Dutch',
  height_cm numeric(6,2) not null default 170,
  current_weight_kg numeric(6,2),
  target_weight_kg numeric(6,2) not null default 65,
  waist_cm numeric(6,2) not null default 78,
  chest_cm numeric(6,2) not null default 92,
  hip_cm numeric(6,2) not null default 98,
  body_fat_percentage numeric(5,2),
  bmi numeric(5,2),
  bmi_category text,
  healthy_weight_min_kg numeric(6,2),
  healthy_weight_max_kg numeric(6,2),
  weight_difference_to_goal_kg numeric(6,2),
  onboarding_step int not null default 1,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint body_profiles_height_cm_check check (height_cm >= 80 and height_cm <= 250)
);

create table if not exists public.fitness_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  exercise_days_per_week text not null default '3 days',
  average_workout_duration text not null default '45 min',
  fitness_level text not null default 'Beginner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nutrition_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  healthy_meals_per_day text not null default '3',
  water_daily text not null default '1.5 - 2 L',
  snacks_per_day text not null default '1',
  eats_breakfast boolean not null default true,
  drinks_soft_drinks boolean not null default false,
  drinks_alcohol boolean not null default false,
  uses_supplements boolean not null default false,
  supplements text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lifestyle_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  average_sleep text not null default '7 - 8 hours',
  stress_level text not null default 'Moderate',
  occupation text not null default '',
  daily_activity_level text not null default 'Lightly active',
  smokes boolean not null default false,
  vapes boolean not null default false,
  injuries text,
  medical_limitations text,
  food_allergies text,
  diet_preference text not null default 'None',
  motivation_reason text,
  motivation_score int not null default 8,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goal_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  main_goal text not null default 'Lose weight',
  secondary_goals text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  weight_kg numeric(6,2),
  waist_cm numeric(6,2),
  chest_cm numeric(6,2),
  hip_cm numeric(6,2),
  body_fat_percentage numeric(5,2),
  bmi numeric(5,2),
  measured_at timestamptz not null default now()
);

create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  weight_kg numeric(6,2) not null,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint weight_logs_weight_kg_check check (weight_kg >= 25 and weight_kg <= 350)
);

create index if not exists body_profiles_completed_idx on public.body_profiles(user_id, onboarding_completed);
create index if not exists profiles_welcome_completed_idx on public.profiles(id, welcome_completed);
create index if not exists weight_logs_latest_user_idx on public.weight_logs(user_id, logged_at desc);

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists body_profiles_touch on public.body_profiles;
create trigger body_profiles_touch before update on public.body_profiles for each row execute function public.touch_updated_at();
drop trigger if exists fitness_profiles_touch on public.fitness_profiles;
create trigger fitness_profiles_touch before update on public.fitness_profiles for each row execute function public.touch_updated_at();
drop trigger if exists nutrition_profiles_touch on public.nutrition_profiles;
create trigger nutrition_profiles_touch before update on public.nutrition_profiles for each row execute function public.touch_updated_at();
drop trigger if exists lifestyle_profiles_touch on public.lifestyle_profiles;
create trigger lifestyle_profiles_touch before update on public.lifestyle_profiles for each row execute function public.touch_updated_at();
drop trigger if exists goal_profiles_touch on public.goal_profiles;
create trigger goal_profiles_touch before update on public.goal_profiles for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.body_profiles enable row level security;
alter table public.fitness_profiles enable row level security;
alter table public.nutrition_profiles enable row level security;
alter table public.lifestyle_profiles enable row level security;
alter table public.goal_profiles enable row level security;
alter table public.measurements enable row level security;
alter table public.weight_logs enable row level security;

drop policy if exists "profiles own read" on public.profiles;
create policy "profiles own read" on public.profiles for select using (id = auth.uid());
drop policy if exists "profiles own insert" on public.profiles;
create policy "profiles own insert" on public.profiles for insert with check (id = auth.uid());
drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "body_profiles own" on public.body_profiles;
create policy "body_profiles own" on public.body_profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "fitness_profiles own" on public.fitness_profiles;
create policy "fitness_profiles own" on public.fitness_profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "nutrition_profiles own" on public.nutrition_profiles;
create policy "nutrition_profiles own" on public.nutrition_profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "lifestyle_profiles own" on public.lifestyle_profiles;
create policy "lifestyle_profiles own" on public.lifestyle_profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "goal_profiles own" on public.goal_profiles;
create policy "goal_profiles own" on public.goal_profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "measurements own" on public.measurements;
create policy "measurements own" on public.measurements for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "weight_logs own" on public.weight_logs;
create policy "weight_logs own" on public.weight_logs for all using (user_id = auth.uid()) with check (user_id = auth.uid());
