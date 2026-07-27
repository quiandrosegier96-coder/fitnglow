-- Joyce can prepare multiple challenges in advance.
-- Members only gain read access on the scheduled Belgian calendar date.
drop policy if exists "published daily challenges read" on public.daily_challenges;

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

