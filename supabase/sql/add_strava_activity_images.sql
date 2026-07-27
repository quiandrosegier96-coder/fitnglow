alter table public.strava_activities
add column if not exists image_url text,
add column if not exists map_polyline text;

create index if not exists strava_activities_image_idx
on public.strava_activities(user_id, start_date desc)
where image_url is not null or map_polyline is not null;
