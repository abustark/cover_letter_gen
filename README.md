<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CoverCraft

A professional AI-powered cover letter builder. Generate tailored, job-specific cover letters from your resume and a job description or posting URL.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Add your API key to `.env.local` (see `.env.example`):
   `OPENROUTER_API_KEY=your_key_here`
3. Add your Google OAuth Client ID to `.env.local`:
   `VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com`

   **How to get it:** Google Cloud Console → APIs & Services → Credentials →
   "Create credentials" → OAuth client ID → **Web application**. In
   "Authorized JavaScript origins" add both `http://localhost:3000` and your
   production domain (e.g. `https://coverltr.vercel.app`).

4. Run the app:
   `npm run dev`

## Sign in with Google

Generating a cover letter requires signing in with Google. The button works
natively on desktop (popup) and mobile (full-height sheet). Your session is
persisted in `localStorage` and restored on return visits until the ID token
expires (1 hour); after that you simply sign in again.

The Client ID is **public by design** and safe to bundle — no secrets live in
the browser.

## Deploy to Vercel

The API key is **never shipped to the browser** — `api/*` serverless functions hold it and proxy requests to OpenRouter, and URL job-description fetching also runs server-side (fixes CORS on LinkedIn etc.).

1. Push the repo to GitHub and import it in Vercel (framework: Vite).
2. Add the environment variable `OPENROUTER_API_KEY` in Vercel → Project → Settings → Environment Variables.
3. Add `VITE_GOOGLE_CLIENT_ID` the same way (a public client ID).
4. Add your Vercel domain to the Google OAuth client's **Authorized JavaScript origins**.
5. Deploy. `api/openrouter.ts` and `api/fetch-url.ts` are automatically picked up as serverless functions.

## Build

`npm run build` (runs `tsc --noEmit` typecheck first) → output in `dist/`.
`npm run typecheck` → TypeScript check only.
