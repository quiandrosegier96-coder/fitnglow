alter table public.profiles
  add column if not exists welcome_completed boolean not null default false;

create index if not exists profiles_welcome_completed_idx
  on public.profiles(id, welcome_completed);
