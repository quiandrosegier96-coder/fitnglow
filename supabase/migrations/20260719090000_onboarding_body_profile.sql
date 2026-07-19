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
  current_weight_kg numeric(6,2) not null default 70,
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
  updated_at timestamptz not null default now()
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
  measured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.weight_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  weight_kg numeric(6,2) not null,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_ml int not null check (amount_ml > 0),
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  meal_name text not null,
  calories int,
  protein numeric(6,2),
  carbs numeric(6,2),
  fat numeric(6,2),
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists body_profiles_completed_idx on public.body_profiles(user_id, onboarding_completed);
create index if not exists measurements_user_date_idx on public.measurements(user_id, measured_at desc);
create index if not exists weight_history_user_date_idx on public.weight_history(user_id, logged_at desc);
create index if not exists water_logs_user_date_idx on public.water_logs(user_id, logged_at desc);
create index if not exists meal_logs_user_date_idx on public.meal_logs(user_id, logged_at desc);

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

alter table public.body_profiles enable row level security;
alter table public.fitness_profiles enable row level security;
alter table public.nutrition_profiles enable row level security;
alter table public.lifestyle_profiles enable row level security;
alter table public.goal_profiles enable row level security;
alter table public.measurements enable row level security;
alter table public.weight_history enable row level security;
alter table public.water_logs enable row level security;
alter table public.meal_logs enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles own insert') then
    create policy "profiles own insert" on public.profiles for insert with check (id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'body_profiles' and policyname = 'body_profiles own or staff') then
    create policy "body_profiles own or staff" on public.body_profiles for all using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'fitness_profiles' and policyname = 'fitness_profiles own or staff') then
    create policy "fitness_profiles own or staff" on public.fitness_profiles for all using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'nutrition_profiles' and policyname = 'nutrition_profiles own or staff') then
    create policy "nutrition_profiles own or staff" on public.nutrition_profiles for all using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'lifestyle_profiles' and policyname = 'lifestyle_profiles own or staff') then
    create policy "lifestyle_profiles own or staff" on public.lifestyle_profiles for all using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'goal_profiles' and policyname = 'goal_profiles own or staff') then
    create policy "goal_profiles own or staff" on public.goal_profiles for all using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'measurements' and policyname = 'measurements own or staff') then
    create policy "measurements own or staff" on public.measurements for all using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'weight_history' and policyname = 'weight_history own or staff') then
    create policy "weight_history own or staff" on public.weight_history for all using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'water_logs' and policyname = 'water_logs own or staff') then
    create policy "water_logs own or staff" on public.water_logs for all using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'meal_logs' and policyname = 'meal_logs own or staff') then
    create policy "meal_logs own or staff" on public.meal_logs for all using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid());
  end if;
end $$;
