do $$
declare
  keep_user_id uuid;
  deleted_auth_users int;
  table_name text;
begin
  select au.id
  into keep_user_id
  from auth.users au
  left join public.profiles p on p.id = au.id
  where lower(coalesce(p.email, au.email, '')) = 'joyceplysier@outlook.com'
     or lower(coalesce(p.full_name, '')) = 'joyce plysier'
  order by case when lower(coalesce(p.email, au.email, '')) = 'joyceplysier@outlook.com' then 0 else 1 end
  limit 1;

  if keep_user_id is null then
    raise exception 'Joyce Plysier was not found by email joyceplysier@outlook.com or full name Joyce Plysier. Nothing was deleted.';
  end if;

  if to_regclass('public.media') is not null then
    update public.media
    set owner_id = null
    where owner_id is not null
      and owner_id <> keep_user_id;
  end if;

  foreach table_name in array array['exercises', 'workouts', 'recipes', 'nutrition_plans', 'tips']
  loop
    if to_regclass('public.' || table_name) is not null then
      execute format('update public.%I set created_by = $1 where created_by is not null and created_by <> $1', table_name)
      using keep_user_id;
    end if;
  end loop;

  foreach table_name in array array[
    'exercise_ratings',
    'exercise_comments',
    'favorite_workouts',
    'completed_workouts',
    'user_xp_events',
    'meal_logs',
    'water_logs',
    'weight_history',
    'measurements',
    'goal_profiles',
    'lifestyle_profiles',
    'nutrition_profiles',
    'fitness_profiles',
    'body_profiles',
    'settings',
    'favorites',
    'comments',
    'achievements',
    'streaks',
    'notifications',
    'weight_logs',
    'progress',
    'roles'
  ]
  loop
    if to_regclass('public.' || table_name) is not null then
      execute format('delete from public.%I where user_id <> $1', table_name)
      using keep_user_id;
    end if;
  end loop;

  if to_regclass('public.profiles') is not null then
    delete from public.profiles where id <> keep_user_id;
  end if;

  delete from auth.users where id <> keep_user_id;
  get diagnostics deleted_auth_users = row_count;

  raise notice 'Reset complete. Kept Joyce Plysier user_id %, deleted % auth users.', keep_user_id, deleted_auth_users;
end $$;

select
  au.id,
  au.email,
  p.full_name,
  p.welcome_completed
from auth.users au
left join public.profiles p on p.id = au.id
order by au.created_at desc;
