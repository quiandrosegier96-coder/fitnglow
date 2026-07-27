create table if not exists public.daily_challenge_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid not null references public.daily_challenges(id) on delete cascade,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, challenge_id)
);

create index if not exists daily_challenge_completions_user_idx
on public.daily_challenge_completions(user_id, completed_at desc);

alter table public.daily_challenge_completions enable row level security;

drop policy if exists "daily challenge completions own read" on public.daily_challenge_completions;
create policy "daily challenge completions own read"
on public.daily_challenge_completions
for select
to authenticated
using (user_id = auth.uid() or public.is_staff());

drop policy if exists "daily challenge completions own write" on public.daily_challenge_completions;
create policy "daily challenge completions own write"
on public.daily_challenge_completions
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "daily challenges authenticated write" on public.daily_challenges;
drop policy if exists "daily challenges staff write" on public.daily_challenges;
create policy "daily challenges staff write"
on public.daily_challenges
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "authenticated daily challenge media upload" on storage.objects;
drop policy if exists "authenticated daily challenge media update" on storage.objects;
drop policy if exists "authenticated daily challenge media delete" on storage.objects;
drop policy if exists "staff daily challenge media upload" on storage.objects;
drop policy if exists "staff daily challenge media update" on storage.objects;
drop policy if exists "staff daily challenge media delete" on storage.objects;

create policy "staff daily challenge media upload"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'daily-challenges' and public.is_staff());

create policy "staff daily challenge media update"
on storage.objects
for update
to authenticated
using (bucket_id = 'daily-challenges' and public.is_staff())
with check (bucket_id = 'daily-challenges' and public.is_staff());

create policy "staff daily challenge media delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'daily-challenges' and public.is_staff());
