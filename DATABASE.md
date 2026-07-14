# Database

The foundation migration is:

```text
supabase/migrations/20260714220000_initial_project_foundation.sql
supabase/migrations/20260714223000_workout_module.sql
```

## Tables

- `profiles`
- `roles`
- `media`
- `exercises`
- `workouts`
- `workout_categories`
- `workout_exercises`
- `recipes`
- `nutrition_plans`
- `nutrition_days`
- `tips`
- `progress`
- `weight_logs`
- `notifications`
- `streaks`
- `badges`
- `achievements`
- `comments`
- `favorites`
- `settings`
- `completed_workouts`
- `favorite_workouts`
- `exercise_media`
- `exercise_comments`
- `exercise_ratings`

## Security

Every table has Row Level Security enabled. Users can access their own private data. Coaches and administrators receive staff-level read/manage access where appropriate. Only administrators can write roles and badges.
