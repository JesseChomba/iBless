# iBless — Spread blessings. Share smiles.

> **Disclaimer: This is just a joke project!**  
> iBless is a lighthearted, tongue-in-cheek web app made purely for fun—imagine an overly official "Goodwill Dispatch Desk" for sending dramatic, wholesome, or cheeky digital blessings to your friends. Don't take the "Goodwill Officer" ranks or blessing tracking too seriously!

## What Is This Project?

iBless is a playful Progressive Web App (PWA) where users can create an account, pick a `@username`, and send, receive, request, save, and share personalised digital blessing cards. It is built with **React**, **TypeScript**, **Tailwind CSS**, **Vite PWA**, **Firebase Authentication**, **Cloud Firestore**, and **Firebase Storage**.

---

## Features

- **Authentication & Profiles**: Email/password registration, Google Sign-In, password reset, unique `@username` registration, 3-step onboarding, profile editing, and avatar uploads.
- **The Blessing Engine**: 12 universal blessing categories + custom writing mode, 36+ starter templates, 6 stationery card styles, live card preview, private-by-default visibility, status tracking (`Dispatched`, `Delivered`, `Read`, `Acknowledged`), thank-you replies, and reciprocal blessings.
- **Blessing Requests & Public Feed**: Send private requests to friends or post public encouragement requests to the community feed; react to public blessings.
- **Social Connections & Safety**: Search by username, send/accept/decline/cancel friend requests, shareable profile URLs (`/u/:username`) & QR codes, and user blocking enforced at the Firestore security-rules level.
- **External Sharing**: High-DPI PNG blessing card downloads, copy text, WhatsApp share links, Web Share API, and visibility-safe public links (`/b/:blessingId`).
- **Daily Blessings & Gamification**: 108 locally curated daily blessings rotating daily, activity streaks, 12 unlockable achievements, and 6 humorous Goodwill Officer ranks (no leaderboards, no pay-to-win).
- **Notifications & PWA**: In-app Notification Centre, optional browser notifications, light/dark mode, offline banner, and installable PWA manifest & service worker.

---

## Prerequisites

- **Node.js** 18+ and **npm**
- **Firebase CLI** (`npm install -g firebase-tools`) for manual hosting/rules/indexes deployment
- A **Firebase project** (this workspace is pre-provisioned via `firebase-applet-config.json`)

---

## Installing Dependencies

```bash
npm install
```

---

## Firebase Configuration

This project reads its Firebase web configuration from `/firebase-applet-config.json` (already provisioned for this workspace). If connecting to a different Firebase project:

1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Register a Web App and copy your config values into `firebase-applet-config.json`.
3. **Enable Authentication Providers**:
   - Open **Authentication -> Sign-in method**.
   - Enable **Email/Password** (required for email registration, login, and password reset).
   - Enable **Google** (optional one-click sign-in).
4. **Create Cloud Firestore**:
   - Open **Firestore Database -> Create database**.
   - Ensure `firestoreDatabaseId` in `firebase-applet-config.json` matches your database ID (`(default)` or your named database).
5. **Configure Firebase Storage** (optional for hosted avatars):
   - Open **Storage -> Get started**.
   - Deploy `storage.rules` (if Storage is not yet enabled, iBless automatically falls back to compact compressed avatar images so profile photos continue to work).
6. **Deploy Security Rules & Indexes**:
   ```bash
   firebase login
   firebase use <your-project-id>
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```

> **Security Note**: Review `firestore.rules` and `storage.rules` before sharing your deployment broadly. Email addresses are isolated in `/userPrivate/{uid}` and never exposed in public profile queries.

---

## Browser Push Notifications

iBless includes an opt-in browser notification toggle in **Settings -> Appearance & Alerts**. When granted, new incoming blessings trigger native browser notifications while the app is active alongside real-time in-app notifications.

---

## Environment Variables

See `.env.example` for optional runtime variables. No Firebase secrets or service account keys are stored in frontend source code.

---

## Running Locally

```bash
npm run dev
```

The development server runs at `http://localhost:3000`.

---

## Building & Deploying

```bash
npm run build
```

### Deploying to Vercel via GitHub

This repo includes `vercel.json` for single-page app route rewrites:

1. Push the repository to GitHub (make sure `firebase-applet-config.json`, `public/`, and `src/assets/` are committed).
2. Import the repo in [Vercel](https://vercel.com) using the **Vite** preset (`npm run build`, output directory `dist`, no environment variables required).
3. After deploying, open **Firebase Console → Authentication → Settings → Authorized domains** and add your `*.vercel.app` domain (and any custom domain) so Google Sign-In works.

### Deploying to Firebase Hosting

1. Initialize hosting (`firebase init hosting`) with `dist` as the public directory and single-page app rewrites enabled (`index.html`).
2. Deploy:
   ```bash
   firebase deploy --only hosting,firestore:rules,firestore:indexes
   ```

---

## Troubleshooting

- **`auth/operation-not-allowed` on Email/Password sign-up**: Enable the **Email/Password** provider in Firebase Console under *Authentication -> Sign-in method*. Google Sign-In works immediately.
- **Permission denied in Firestore**: Ensure `firestore.rules` have been deployed (`firebase deploy --only firestore:rules`) and the user is signed in.
- **PWA icons / install button not appearing**: Serve over `https://` (or `http://localhost`) in a supported Chromium browser.
