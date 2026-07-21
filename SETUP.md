# SafeSteps — Setup Guide

Welcome! This guide will help you get SafeSteps running locally.

## Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- A [Firebase](https://firebase.google.com) project with Authentication and Firestore enabled

## Step 1: Clone & Install

```bash
git clone https://github.com/safeunashamed-prog/SafeSteps.git
cd SafeSteps
bun install
```

## Step 2: Configure Firebase

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to **Project settings** → **General** → scroll down to **Your apps**
4. Click **Add app** → **Web** (the `</>` icon)
5. Register the app (name it "SafeSteps")
6. Copy the `firebaseConfig` values shown
7. Create a `.env` file in the project root:

```bash
cp .env.example .env
```

8. Fill in `.env` with your Firebase values:

```
VITE_FIREBASE_API_KEY=AIzaSy...          # from firebaseConfig.apiKey
VITE_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com   # from firebaseConfig.authDomain
VITE_FIREBASE_PROJECT_ID=project-id       # from firebaseConfig.projectId
VITE_FIREBASE_STORAGE_BUCKET=project.appspot.com    # from firebaseConfig.storageBucket
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789       # from firebaseConfig.messagingSenderId
VITE_FIREBASE_APP_ID=1:123456789:web:abc123       # from firebaseConfig.appId
```

## Step 3: Enable Firebase Services

In the Firebase Console, enable the following for your project:

### Authentication
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** sign-in
3. Enable **Anonymous** sign-in (backup/graceful fallback)

### Firestore Database
1. Go to **Firestore Database** → **Create database**
2. Choose **Start in test mode** (you can tighten rules later)
3. Select a location closest to your users

## Step 4: Run the App

```bash
bun run dev
```

The app will be available at **http://localhost:3000**.

## Step 5: Verify

- The home screen should show four tool buttons: Help Me Right Now, What's Happening?, My Triggers, Daily Check-In
- The sunflower logo and "You're safe. Let's take this one step at a time." message should appear
- The bottom navigation bar should be visible with 5 tabs

## Deploying to Production

```bash
bun run build   # builds to dist/
```

Serve the `dist/` directory from any static host. The PWA service worker is generated
automatically and will enable offline support and home-screen installation.

## Troubleshooting

**"Firebase not initialized"** — Make sure your `.env` file exists and all `VITE_FIREBASE_*`
variables are set. Restart the dev server after changes.

**Authentication errors** — Check that Email/Password and Anonymous sign-in are enabled
in the Firebase Console under Authentication → Sign-in method.

**Blank page** — Check the browser console for errors. Make sure you're on Node 18+ / Bun 1.0+.
