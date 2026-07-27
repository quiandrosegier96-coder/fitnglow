-- Run this once in the Supabase SQL Editor for the existing environment.
-- Joyce can schedule multiple challenges in advance.
-- Members only see a published challenge from its scheduled Belgian date onward.
alter table public.daily_challenges enable row level security;

drop policy if exists "published daily challenges read" on public.daily_challenges;
drop policy if exists "daily challenges public read" on public.daily_challenges;
drop policy if exists "daily challenges authenticated write" on public.daily_challenges;
drop policy if exists "daily challenges staff write" on public.daily_challenges;
drop policy if exists "staff daily challenges write" on public.daily_challenges;
drop policy if exists "daily challenges admin write" on public.daily_challenges;
drop policy if exists "daily challenges only joyce write" on public.daily_challenges;
drop policy if exists "daily challenges only joyce insert" on public.daily_challenges;
drop policy if exists "daily challenges only joyce update" on public.daily_challenges;
drop policy if exists "daily challenges only joyce delete" on public.daily_challenges;

create policy "published daily challenges read"
on public.daily_challenges
for select
to authenticated
using (
  public.is_daily_challenge_uploader()
  or (
    is_published = true
    and challenge_date <= (now() at time zone 'Europe/Brussels')::date
  )
);

create policy "daily challenges only joyce insert"
on public.daily_challenges
for insert
to authenticated
with check (public.is_daily_challenge_uploader());

create policy "daily challenges only joyce update"
on public.daily_challenges
for update
to authenticated
using (public.is_daily_challenge_uploader())
with check (public.is_daily_challenge_uploader());

create policy "daily challenges only joyce delete"
on public.daily_challenges
for delete
to authenticated
using (public.is_daily_challenge_uploader());

alter table public.daily_challenge_completions enable row level security;

drop policy if exists "daily challenge completions own read" on public.daily_challenge_completions;
drop policy if exists "daily challenge completions own write" on public.daily_challenge_completions;

create policy "daily challenge completions own read"
on public.daily_challenge_completions
for select
to authenticated
using (user_id = auth.uid());

create policy "daily challenge completions own write"
on public.daily_challenge_completions
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
