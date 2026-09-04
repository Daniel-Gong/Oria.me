# Architecture Overview

## Goal

Use one Firebase-backed system across:

- iOS app
- website (`oria.me`)
- admin portal
- Cloud Functions and Firestore

## Ownership Boundary

`oria.me` owns website pages, web runtime configuration, admin UI, and deployment workflow.

The sibling backend repo owns canonical backend contracts and backend internals:

- [TheOtherME backend docs](../../../TheOtherME/docs/backend/README.md)
- [TheOtherME integration docs](../../../TheOtherME/docs/integrations/oria-me.md)

## Key design

- Website is static (GitHub Pages) and calls Cloud Functions over HTTPS.
- Public growth writes are server-side via Functions (no direct browser writes to Firestore for **anonymous** marketing flows).
- Signed-in users on the **app portal** (`/app/`) use Firebase Auth + Firestore directly, consistent with the iOS app and security rules.
- Admin actions are protected by Firebase Auth ID token + custom claim `admin: true`.
- Web docs should describe how the website uses backend endpoints, not restate backend implementation internals.

## Main website runtime config

- `js/config/runtime-config.js` contains environment-level runtime values:
  - Firebase web config
  - Functions region/base URL
- `js/config/firebase-app.js` is the shared Firebase initializer used by web pages.

## Main website modules

- Landing/newsletter flow: `index.html` + `js/main.js`
- Invite deep-link landing: `invite.html` + `js/invite.js`
- Profile deep-link landing: `profile.html` + `js/profile.js`
- Account deletion (Play store URL): `delete-account.html` + `js/delete-account.js`
- Admin surface: `admin/index.html`
- **Authenticated app portal:** `app/` (Vite + React), deployed under **`/app/`** on GitHub Pages (`https://oria.me/app/`). Uses **Firebase Auth + Firestore** in the browser for signed-in users (same project as iOS). See `app/README.md`.
- Optional local/dev proxy server: `server/server.js`

## Backend surfaces consumed here

- Public waitlist/newsletter endpoints
- Invite validation endpoint
- Admin waitlist and invite-code endpoints
- **App portal:** direct Firestore reads/writes under `users/{uid}/…` for notes, moments, insights, profile, memories (see TheOtherME `docs/backend/firestore-and-storage.md`); no new HTTP endpoints required for the MVP portal.
- **Account deletion:** Firebase Auth `user.delete()` from `delete-account.html` and the app portal Profile page (same as the iOS and Android apps).

For the canonical contract definitions and backend source files, use the sibling backend docs rather than this page.
