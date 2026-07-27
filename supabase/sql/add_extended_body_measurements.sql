alter table public.measurements
  add column if not exists upper_arm_cm numeric(6,2),
  add column if not exists upper_leg_cm numeric(6,2),
  add column if not exists calf_cm numeric(6,2);

alter table public.measurements
  drop constraint if exists measurements_upper_arm_cm_check,
  drop constraint if exists measurements_upper_leg_cm_check,
  drop constraint if exists measurements_calf_cm_check;

alter table public.measurements
  add constraint measurements_upper_arm_cm_check check (upper_arm_cm is null or (upper_arm_cm >= 15 and upper_arm_cm <= 90)),
  add constraint measurements_upper_leg_cm_check check (upper_leg_cm is null or (upper_leg_cm >= 25 and upper_leg_cm <= 120)),
  add constraint measurements_calf_cm_check check (calf_cm is null or (calf_cm >= 15 and calf_cm <= 90));
