# Deployment

## Vercel

1. Import the repository into Vercel.
2. Set environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

3. Build command:

```bash
npm run build
```

4. Output is handled automatically by Next.js.

## Production Notes

- Use Supabase RLS as the primary data security boundary.
- Never expose the service role key in the browser.
- Configure production OAuth redirect URLs before launch.
- Replace `public/logo.svg` with the official uploaded logo if a different source asset is provided.
