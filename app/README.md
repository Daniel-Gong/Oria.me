# Oria app portal (`app.oria.me` / `/app/`)

Authenticated web surface for existing Firebase users: notes, moments, insights (read-only JSON), profile fields, and long-term memories. Uses the same Firestore paths as the iOS app.

## URLs

- **Production (GitHub Pages):** `https://oria.me/app/` (hash routes, e.g. `https://oria.me/app/#/notes`).
- **Subdomain:** Point `app.oria.me` at the same hosting and path, or configure a reverse proxy to serve `/app/`.
- **Account deletion (Play / public URL):** `https://oria.me/delete-account`. Signed-in portal users can also delete from Profile.

## Local development

```bash
cd app
cp .env.example .env.local
# Fill VITE_* keys from Firebase Console (Web app) — same project as iOS (`theotherme-33e92` per docs).
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173/app/` because of `base: '/app/'`).

## Firebase Console checklist

1. **Authentication → Authorized domains:** include `localhost`, `oria.me`, `www.oria.me`, and `app.oria.me` (if used).
2. **Google sign-in:** Web client OAuth consent; authorized JavaScript origins must include your dev and prod origins.
3. **App Check:** optional; if the web App Check key is set, the portal initializes reCAPTCHA v3 like the main site.

## Deploy

The GitHub Actions workflow `Deploy to GitHub Pages` builds this package and copies `app/dist/*` into `_site/app/`.
