# Fit & Glow Club

Premium mobile-first fitness, nutrition, progress, coaching, and admin platform built with Next.js 15, React 19, TypeScript, TailwindCSS, Supabase, TanStack Query, React Hook Form, Zod, and Framer Motion.

## Features

- Supabase authentication foundation with email, registration, password reset, Google OAuth, Apple OAuth, session persistence, and role-aware middleware.
- Protected app shell with responsive sidebar, mobile bottom navigation, notification center, profile dropdown, skeleton loading, 404, error, and maintenance pages.
- Dashboard foundation with workout, streak, calories, weight progress, recipes, motivation, quick actions, and progress graph.
- PWA manifest, service worker, offline shell cache, and install prompt.
- Secure API route scaffolding with CSRF origin checks, rate limiting, and Zod validation.
- Supabase migration with UUID tables, timestamps, relationships, indexes, and RLS policies.

## Local Development

```bash
npm.cmd install
npm.cmd run dev
```

Open `http://127.0.0.1:3000/dashboard`.

## Environment

Copy `.env.example` to `.env.local` and set:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
```

## Strava

Create a Strava app at `https://www.strava.com/settings/api`.

Use this local callback:

```text
http://127.0.0.1:3000/api/strava/callback
```

Use this production callback:

```text
https://fitandglow.netlify.app/api/strava/callback
```
