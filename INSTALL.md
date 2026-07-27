# Installation

1. Install dependencies:

```bash
npm.cmd install
```

2. Create `.env.local` from `.env.example`.

3. Configure Supabase Auth providers:

- Email/password
- Google OAuth
- Apple OAuth
- Email verification
- Password reset redirect URL: `/reset-password`

4. Apply the Supabase migration:

```bash
supabase db push
```

5. Start the app:

```bash
npm.cmd run dev
```
