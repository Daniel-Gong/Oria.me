# Deploy and Verify

## Deploy order

1. Deploy backend Functions first.
2. Deploy website (GitHub Pages) after Functions are healthy.

## Backend deploy

From `../TheOtherME/backend/functions`:

- `npm run build`
- deploy with your standard Firebase target (staging/prod alias)

## Website deploy

- Push to `main` to trigger GitHub Pages workflow.
- Confirm deployed artifact includes:
  - `js/config/runtime-config.js`
  - `js/config/firebase-app.js`
  - updated `js/main.js`, `js/invite.js`, `js/delete-account.js`, `admin/index.html`
  - `delete-account.html` (Play Console delete-account URL)
  - **`app/index.html`** and **`app/assets/*`** (Vite app portal under `/app/`)

## Smoke tests

1. **Homepage newsletter submit**
   - Submit email on `/#newsletter`.
   - Verify success response and entry in Firestore `newsletterSubscribers`.
   - Verify invalid email or excessive retries are blocked.
2. **Waitlist intake**
   - Trigger waitlist flow via `publicJoinWaitlist`.
   - Verify entry lands in Firestore `waitlist`.
3. **Invite validation**
   - Open `/invite/<code>`.
   - Verify invalid code is blocked and valid code deep-links/fallbacks correctly.
   - Verify request succeeds with valid App Check token.
4. **Admin auth**
   - Sign in at `/admin/`.
   - Verify waitlist load + create marketing codes works.
   - Verify invite codes are split into marketing/waitlist/user sections.
   - Verify user-code max usage does not incorrectly display as infinite when `maxInvites` exists.
   - Verify edit/revoke/hard-delete actions behave as expected.
5. **Email flow**
   - Approve waitlist entries and confirm email send status updates.
6. **Invite attribution + trial**
   - Open `/invite/<validCode>` with no UTM params and confirm URL gets expected `utm_*`.
   - Confirm returned trial value aligns with `benefit.trialDays` (fallback 7 when absent).
7. **App portal**
   - Open `https://oria.me/app/#/login`, sign in with a test user (email or Google).
   - Confirm `/#/notes` loads and a test note round-trips with the iOS app (same Firestore path).
8. **Account deletion page**
   - Open `https://oria.me/delete-account`.
   - Confirm the page names Oria AI / TheOther Intelligence LLC, lists in-app and web steps, and states data deleted vs kept plus retention.
   - On a disposable test account, sign in and complete deletion; confirm Firebase Auth no longer accepts that user.

## Rollback notes

- If public endpoints fail, website should still show non-crashing fallback UI.
- Revert website deploy independently from backend if needed.
