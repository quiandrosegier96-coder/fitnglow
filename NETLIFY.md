# Netlify Deployment

## Deploy from GitHub

1. Go to Netlify and choose **Add new site**.
2. Select **Import an existing project**.
3. Connect GitHub.
4. Choose the repository:

```text
quiandrosegier96-coder/fitnglow
```

5. Netlify should read `netlify.toml` automatically.

## Build Settings

```text
Build command: npm run build
Publish directory: .next
```

## Environment Variables

Add these in Netlify under **Site configuration > Environment variables**:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=https://your-netlify-site.netlify.app
```

## Supabase Redirect URLs

Add these URLs in Supabase Authentication settings after Netlify gives you the live domain:

```text
https://your-netlify-site.netlify.app/dashboard
https://your-netlify-site.netlify.app/reset-password
```

Also update Google and Apple OAuth redirect settings if those providers are enabled.
