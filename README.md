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
3. Run the app:
   `npm run dev`

## Deploy to Vercel

The API key is **never shipped to the browser** — `api/*` serverless functions hold it and proxy requests to OpenRouter, and URL job-description fetching also runs server-side (fixes CORS on LinkedIn etc.).

1. Push the repo to GitHub and import it in Vercel (framework: Vite).
2. Add the environment variable `OPENROUTER_API_KEY` in Vercel → Project → Settings → Environment Variables.
3. Deploy. `api/openrouter.ts` and `api/fetch-url.ts` are automatically picked up as serverless functions.

## Build

`npm run build` (runs `tsc --noEmit` typecheck first) → output in `dist/`.
`npm run typecheck` → TypeScript check only.
