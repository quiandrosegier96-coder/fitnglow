# Supabase Setup

1. Create a Supabase project.
2. Add environment variables to `.env.local`.
3. Enable email confirmations in Authentication settings.
4. Add OAuth providers:

- Google
- Apple

5. Configure redirect URLs:

```text
http://localhost:3000/dashboard
http://localhost:3000/reset-password
https://your-production-domain.com/dashboard
https://your-production-domain.com/reset-password
```

6. Apply migrations:

```bash
supabase db push
```

7. Create the first administrator by inserting an `administrator` role for your user in the `roles` table.
