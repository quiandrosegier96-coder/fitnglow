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
  updated_at timestamptz not null default now(),
  constraint body_profiles_height_cm_check check (height_cm >= 80 and height_cm <= 250),
  constraint body_profiles_current_weight_kg_check check (current_weight_kg >= 25 and current_weight_kg <= 350),
  constraint body_profiles_target_weight_kg_check check (target_weight_kg >= 25 and target_weight_kg <= 350)
);

create index if not exists body_profiles_completed_idx
  on public.body_profiles(user_id, onboarding_completed);

alter table public.body_profiles enable row level security;

drop policy if exists "body_profiles own read" on public.body_profiles;
create policy "body_profiles own read"
  on public.body_profiles
  for select
  using (user_id = auth.uid());

drop policy if exists "body_profiles own insert" on public.body_profiles;
create policy "body_profiles own insert"
  on public.body_profiles
  for insert
  with check (user_id = auth.uid());

drop policy if exists "body_profiles own update" on public.body_profiles;
create policy "body_profiles own update"
  on public.body_profiles
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
