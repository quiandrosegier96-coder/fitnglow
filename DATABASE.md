# Database

The foundation migration is:

```text
supabase/migrations/20260714220000_initial_project_foundation.sql
supabase/migrations/20260714223000_workout_module.sql
supabase/migrations/20260719090000_onboarding_body_profile.sql
supabase/migrations/20260719103000_dynamic_dashboard.sql
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
- `body_profiles`
- `fitness_profiles`
- `nutrition_profiles`
- `lifestyle_profiles`
- `goal_profiles`
- `measurements`
- `weight_history`
- `water_logs`
- `meal_logs`
- `motivational_quotes`
- `user_xp_events`

## Security

Every table has Row Level Security enabled. Users can access their own private data. Coaches and administrators receive staff-level read/manage access where appropriate. Only administrators can write roles and badges.
