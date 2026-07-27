insert into public.profiles (id, email, full_name)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'full_name', 'Joyce Plysier')
from auth.users
where lower(email) in ('joyceplysier@outlook.com', 'joyceplysier@icloud.com')
on conflict (id) do update
set
  email = excluded.email,
  full_name = coalesce(public.profiles.full_name, excluded.full_name);

insert into public.roles (user_id, role)
select id, 'administrator'::public.app_role
from auth.users
where lower(email) in ('joyceplysier@outlook.com', 'joyceplysier@icloud.com')
on conflict (user_id, role) do nothing;
