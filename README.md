<div align="center">
  <img src="docs/assets/covercraft-home-light.png" alt="CoverCraft app: resume and job description filled in, with mode and tone selectors above the sign-in prompt" width="880" />

  <sub><a href="docs/assets/covercraft-home-dark.png">Dark mode screenshot</a></sub>
</div>

# CoverCraft

**Resume + job posting → a tailored cover letter, in the tone you pick.**

[Live demo](https://coverltr.vercel.app/) · [Issues](https://github.com/abustark/cover_letter_gen/issues) · [Project facts](PROJECT-INFO.md)

CoverCraft turns two unstructured documents — a resume (PDF or DOCX) and a job description (pasted text or a posting URL) — into a job-specific cover letter you can copy, export as PDF/DOCX, or keep as a draft. The browser never holds the model API key.

---

## Features

| | |
|---|---|
| **Four generation modes** | Balanced, Thinking (deeper reasoning for senior roles), Low Latency, From URL (reads the posting from a link) |
| **Four tones** | Professional, Enthusiastic, Confident, Creative — injected into the system prompt |
| **Resume intake** | PDF via `pdfjs-dist`, DOCX via `mammoth`, both lazy-loaded; optional AI reformatting into clean sections |
| **Dual job input** | Paste text, or paste a URL — the posting is fetched and cleaned server-side, which sidesteps browser CORS |
| **Google sign-in** | `@react-oauth/google`; the ID token is decoded client-side and expires after one hour |
| **Export suite** | One-click copy, PDF (`jsPDF`), DOCX (`docx`), save draft, regenerate |
| **Local drafts** | UUID keys and ISO timestamps in `localStorage`; click to reload, hover to delete |
| **Dark / light theme** | Persisted preference, View-Transition wave from the toggle, CSS ripple fallback |
| **Accessible controls** | `role="tablist"` segmented controls, visible focus rings, ≥44 px targets, `prefers-reduced-motion` respected |

---

## Architecture

A thin server boundary around a rich client: the SPA does parsing, prompting and export; two Vercel functions hold the credentials and the network edge cases.

```
Browser (React SPA)
  ├── resume PDF/DOCX ──► pdfjs-dist / mammoth  (lazy import) ──► text
  ├── job description ──► pasted text
  └── job posting URL ──► POST /api/fetch-url ──► stripped text (≤ 12k chars)
                                   │
                                   ▼
                     POST /api/openrouter ──► OpenRouter
                                   │            (3 free models, temp 0.7)
                                   ▼
              letter ──► copy · PDF · DOCX · draft (localStorage)
```

### Endpoints

| Method | Route | Purpose | Guardrails |
|---|---|---|---|
| `POST` | `/api/openrouter` | Proxies chat completions to OpenRouter | Key from server env only · temperature pinned at `0.7` · `400` on missing `model`/`messages` · `502` on empty completion |
| `POST` | `/api/fetch-url` | Fetches a job posting and strips it to text | `<script>`/`<style>` removed · tags collapsed · capped at **12,000 chars** · `502` on fetch failure |

### Model routing

| Mode | Model |
|---|---|
| Balanced | `nvidia/nemotron-3-ultra-550b-a55b:free` |
| Thinking Mode | `nvidia/nemotron-3-super-120b-a12b:free` |
| Low Latency | `google/gemma-4-26b-a4b-it:free` |
| From URL | `nvidia/nemotron-3-ultra-550b-a55b:free` |
| Resume formatting | `google/gemma-4-26b-a4b-it:free` |

---

## Stack

| Layer | Choice |
|---|---|
| UI | React 19, React DOM 19 |
| Build | Vite 6, `@vitejs/plugin-react` |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Language | TypeScript 5.8 (`tsc --noEmit` gate) |
| AI | OpenRouter chat completions — three free models |
| Auth | Google OAuth 2.0 (`@react-oauth/google`) |
| Parsing | `pdfjs-dist`, `mammoth` (dynamic imports) |
| Export | `jsPDF`, `docx` (dynamic imports) |
| Hosting | Vercel — `api/*.ts` become serverless functions |

---

## Project layout

```
.
├── api/                    Vercel functions: LLM proxy + posting fetch
├── components/             Header, InputSection, ModeSelector, OutputSection,
│                           DraftsSection, GoogleButton, UI primitives, icons
├── services/               OpenRouter prompts/routing · Google auth state
├── public/                 favicon, Open Graph image
├── docs/
│   ├── PORTFOLIO-FRAMING.md    how to present this project on a portfolio
│   ├── bugs-and-fixes/         bug-registry protocol kit
│   └── sandbox-browser/        headless visual-check kit
├── App.tsx                 app shell, state, generation flow
├── index.tsx               React entry point
├── index.css               Tailwind theme tokens and document surface
├── types.ts                shared enums and interfaces
├── vite.config.ts          dev-only key injection, chunk splitting
├── PROJECT-INFO.md         fact sheet (stack, architecture, metrics)
├── AGENTS.md               working rules for AI agents
└── COMMIT-HISTORY.md       versioned commit log
```

---

## Getting started

**Prerequisites:** Node.js 18+ (Vite 6), a Google OAuth client, and an OpenRouter API key.

```bash
npm install
cp .env.example .env.local   # then fill in both values
npm run dev                  # http://localhost:3000
```

When port 3000 is taken, Vite picks the next free port.

### Google OAuth setup

1. Google Cloud Console → **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID** → **Web application**.
2. Under **Authorized JavaScript origins**, add `http://localhost:3000` and your production domain.
3. Copy the client ID into `VITE_GOOGLE_CLIENT_ID`.

### Environment variables

| Variable | Where | Notes |
|---|---|---|
| `OPENROUTER_API_KEY` | `.env.local` (dev) · Vercel env (prod) | Read from `.env.local` first, so a stale machine-level key cannot silently win |
| `VITE_GOOGLE_CLIENT_ID` | `.env.local` · Vercel env | Public by design — client IDs are meant to be shipped |

---

## Deploy to Vercel

1. Import the repo in Vercel — framework preset **Vite**, no `vercel.json` needed.
2. Add `OPENROUTER_API_KEY` and `VITE_GOOGLE_CLIENT_ID` under **Settings → Environment Variables**.
3. Add the production domain to the OAuth client's **Authorized JavaScript origins**.
4. Deploy. `api/openrouter.ts` and `api/fetch-url.ts` are detected automatically.

`npm run build` runs `tsc --noEmit` before bundling into `dist/`; `npm run typecheck` runs the type gate alone.

---

## Security model

**Protected by design**

- In production the bundle contains **no API key** — `vite.config.ts` injects it only when `mode === 'development'`; every deployed request goes through `/api/openrouter`.
- The key is read from `.env.local` before environment variables, so a stale machine-level key can't override the project one.
- Job postings are fetched server-side with a `User-Agent` header, which avoids both browser CORS and leaking the key to third-party pages.
- `localStorage` holds only a Google ID token (1-hour expiry), drafts, and the theme.

**Not protected (known and deliberate)**

- `/api/openrouter` is an open proxy: no authentication and **no rate limiting**.
- `/api/fetch-url` accepts any URL — there is no scheme or host allowlist, so it is an SSRF surface.
- Sign-in is a **client-side gate**: the ID token is decoded, not verified server-side. Generation is blocked in the UI, not at the API.

---

## Status & limitations

- **No database.** Drafts live in `localStorage` and stay on one browser.
- **No automated tests.** The gates are `npm run typecheck` and `npm run build`.
- **Free-tier models** rate-limit and can respond slowly under load.
- This is a single-user utility, not a multi-tenant service — see the security notes above.

---

## Docs

- [`PROJECT-INFO.md`](PROJECT-INFO.md) — stack, architecture and metrics in one sheet
- [`docs/PORTFOLIO-FRAMING.md`](docs/PORTFOLIO-FRAMING.md) — positioning copy for portfolio/resume use
- [`docs/bugs-and-fixes/`](docs/bugs-and-fixes/) — bug registry protocol and template
- [`docs/sandbox-browser/`](docs/sandbox-browser/) — headless visual-check kit (reference implementation)
- [`AGENTS.md`](AGENTS.md) · [`COMMIT-HISTORY.md`](COMMIT-HISTORY.md)

---

## License

All rights reserved — see [LICENSE](LICENSE).

<sub>Built by [ABu](https://github.com/abustark).</sub>
