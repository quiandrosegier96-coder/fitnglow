create table if not exists public.measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  weight_kg numeric(6,2),
  waist_cm numeric(6,2),
  chest_cm numeric(6,2),
  hip_cm numeric(6,2),
  upper_arm_cm numeric(6,2),
  upper_leg_cm numeric(6,2),
  calf_cm numeric(6,2),
  body_fat_percentage numeric(5,2),
  bmi numeric(5,2),
  measured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint measurements_waist_cm_check check (waist_cm is null or (waist_cm >= 40 and waist_cm <= 220)),
  constraint measurements_chest_cm_check check (chest_cm is null or (chest_cm >= 40 and chest_cm <= 220)),
  constraint measurements_hip_cm_check check (hip_cm is null or (hip_cm >= 40 and hip_cm <= 240)),
  constraint measurements_upper_arm_cm_check check (upper_arm_cm is null or (upper_arm_cm >= 15 and upper_arm_cm <= 90)),
  constraint measurements_upper_leg_cm_check check (upper_leg_cm is null or (upper_leg_cm >= 25 and upper_leg_cm <= 120)),
  constraint measurements_calf_cm_check check (calf_cm is null or (calf_cm >= 15 and calf_cm <= 90))
);

create index if not exists measurements_user_date_idx
  on public.measurements(user_id, measured_at desc);

alter table public.measurements enable row level security;

drop policy if exists "measurements own read" on public.measurements;
create policy "measurements own read"
  on public.measurements
  for select
  using (user_id = auth.uid());

drop policy if exists "measurements own insert" on public.measurements;
create policy "measurements own insert"
  on public.measurements
  for insert
  with check (user_id = auth.uid());

drop policy if exists "measurements own update" on public.measurements;
create policy "measurements own update"
  on public.measurements
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "measurements own delete" on public.measurements;
create policy "measurements own delete"
  on public.measurements
  for delete
  using (user_id = auth.uid());
