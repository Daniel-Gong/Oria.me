# Page and Module Map

This page is the website-side map of pages and JavaScript entrypoints.

## Public Pages

- `index.html`
  - marketing landing page
  - newsletter / waitlist capture
  - main client module: `js/main.js`
- `invite.html`
  - invite validation and deep-link landing
  - main client module: `js/invite.js`
- `profile.html`
  - profile universal-link/deep-link landing
  - main client module: `js/profile.js`
- `product.html`
  - product / Try Oria page (`/product`)
  - app functions plus App Store and Google Play download CTAs
  - main client module: `js/main.js`
- `pricing.html`
  - Free vs Premium comparison and yearly / monthly plans (`/pricing`)
  - main client module: `js/main.js`
- `privacy.html`, `terms.html`, `slideshow.html`, `404.html`
  - mostly static pages
  - `privacy.html` (`https://oria.me/privacy`) is the Play / App Store privacy-policy URL. It must disclose Health Data access, collection, and use (Health Connect, Apple Health, optional Fitbit / Google Health) and state data-retention practices, including account deletion and the 30-day backup purge.
- `delete-account.html`
  - Play / store account-deletion URL (`https://oria.me/delete-account`)
  - static disclosure (app name, steps, data deleted vs kept) plus sign-in + Firebase `user.delete()`
  - main client module: `js/delete-account.js`

## Admin Page

- `admin/index.html`
  - admin portal shell for growth operations
  - uses Firebase auth and admin-authorized backend endpoints

## Shared Web Modules

- `js/config/runtime-config.example.js`
  - example runtime configuration shape
- `js/config/firebase-app.js`
  - Firebase app bootstrap and App Check support for browser calls

## Backend Usage by Module

- `js/main.js`
  - calls public newsletter endpoint
  - builds attribution payloads and App Check headers
- `js/invite.js`
  - calls invite validation endpoint
  - stores referral code, handles deep linking, and preserves attribution
- `js/profile.js`
  - handles profile deep-link landing and fallback UX
- `js/delete-account.js`
  - Firebase Auth sign-in (email, Google, Apple) and `user.delete()` on the public delete-account page

## Local/Server Utilities

- `server/server.js`
  - local server/dev helper surface when needed outside static hosting

## Read Next

- Web architecture and ownership: `overview.md`
- Web-side endpoint usage: `../reference/http-endpoints.md`
- Canonical backend contracts: `../../../TheOtherME/docs/backend/function-contracts.md`
