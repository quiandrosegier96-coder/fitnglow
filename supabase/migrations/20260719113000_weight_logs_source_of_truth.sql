alter table public.body_profiles alter column current_weight_kg drop not null;
alter table public.body_profiles alter column current_weight_kg drop default;
alter table public.body_profiles alter column bmi drop default;
alter table public.body_profiles alter column bmi_category drop default;
alter table public.body_profiles alter column weight_difference_to_goal_kg drop default;
alter table public.body_profiles drop constraint if exists body_profiles_height_cm_check;
alter table public.body_profiles add constraint body_profiles_height_cm_check check (height_cm >= 80 and height_cm <= 250);

alter table public.weight_logs drop constraint if exists weight_logs_weight_kg_check;
alter table public.weight_logs add constraint weight_logs_weight_kg_check check (weight_kg >= 25 and weight_kg <= 350);

create index if not exists weight_logs_latest_user_idx on public.weight_logs(user_id, logged_at desc);

insert into public.weight_logs (user_id, weight_kg, logged_at)
select bp.user_id, bp.current_weight_kg, coalesce(bp.updated_at, now())
from public.body_profiles bp
where bp.current_weight_kg is not null
  and not exists (
    select 1 from public.weight_logs wl
    where wl.user_id = bp.user_id
  );

update public.body_profiles
set current_weight_kg = null,
    bmi = null,
    bmi_category = null,
    weight_difference_to_goal_kg = null;
