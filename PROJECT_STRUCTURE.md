# Project Structure

```text
public/
  logo.svg
  manifest.webmanifest
  sw.js
src/
  app/
    (app)/
    (auth)/
    api/
    globals.css
    layout.tsx
    not-found.tsx
    error.tsx
  components/
    ui/
    app-shell.tsx
    auth-form.tsx
    notification-center.tsx
    profile-dropdown.tsx
  data/
  lib/
supabase/
  migrations/
  schema.sql
```

The app uses the Next.js App Router. Protected product pages live in `src/app/(app)`, auth pages live in `src/app/(auth)`, and API route handlers live in `src/app/api`.
