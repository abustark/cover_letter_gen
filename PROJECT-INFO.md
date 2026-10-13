# CoverCraft — Project Info Sheet (source of truth for resume & portfolio summaries)

> **Purpose:** every fact an AI (or a person) needs to write a resume "Projects"
> entry or a portfolio project summary for CoverCraft — without reading the code.
> Generate prose from these facts only; do not invent beyond them. Tune length
> and tone to the target (resume = dense & quantified; portfolio = readable &
> story-driven).

---

## 1. Project identity

| Field | Value |
|---|---|
| Name | **CoverCraft — AI Cover Letter Builder** |
| Type | Full-stack web application (AI productivity utility) |
| Author | ABu (`abustark` on GitHub) |
| Live site | https://coverltr.vercel.app/ |
| Source | https://github.com/abustark/cover_letter_gen |
| License | None declared (private, all rights reserved — footer `© ABu`) |
| Status | Production-deployed on Vercel, actively maintained (2026, latest commit 2026-09-24) |

**One-liners (pick by context):**
- *10 words:* AI cover-letter builder with Google sign-in and PDF/DOCX export.
- *25 words:* CoverCraft is a React + Vite + Tailwind app that drafts tailored cover letters from a resume and job description or posting URL via OpenRouter free models.
- *Elevator pitch:* CoverCraft turns your resume plus a job description — pasted text or a posting URL — into a tailored, professional cover letter. Sign in with Google, pick a tone and generation mode, upload a PDF/DOCX resume with optional AI formatting, then copy, download as PDF/DOCX, or save drafts locally. API keys stay server-side in Vercel functions; the browser never sees them.

---

## 2. Tech stack — exact versions

| Category | Technology | Version | Role |
|---|---|---|---|
| Runtime | Node.js | unpinned (Vite 6 requires Node 18+) | Build/dev runtime |
| Package manager | npm | lockfile `package-lock.json` (8213 lines) | Dependencies/scripts |
| UI framework | React | ^19.2.0 | App UI (`App.tsx`, `components/`) |
| UI DOM | react-dom | ^19.2.0 | Rendering (`index.tsx`) |
| Build tool | Vite | ^6.2.0 | Dev server `:3000`, production build |
| Vite plugin | @vitejs/plugin-react | ^5.0.0 | React Fast Refresh |
| Styling | Tailwind CSS | ^4.3.3 | Utility styling (`index.css` 234 lines) |
| Styling plugin | @tailwindcss/vite | ^4.3.3 | Vite integration |
| Language | TypeScript | ~5.8.2 | Type safety (`tsc --noEmit` gate) |
| AI gateway | OpenRouter chat completions | `https://openrouter.ai/api/v1/chat/completions` | All LLM calls via `api/openrouter.ts` proxy |
| AI models (free) | NVIDIA Nemotron 3 Ultra 550B | `nvidia/nemotron-3-ultra-550b-a55b:free` | Standard + URL modes |
| AI models (free) | NVIDIA Nemotron 3 Super 120B | `nvidia/nemotron-3-super-120b-a12b:free` | Thinking mode |
| AI models (free) | Google Gemma 4 26B | `google/gemma-4-26b-a4b-it:free` | Low-latency + resume-formatting modes |
| Legacy lib | @google/genai | ^1.28.0 | Installed dependency (OpenRouter is the active path) |
| Auth (client) | @react-oauth/google | ^0.13.5 | Google sign-in button + `GoogleOAuthProvider` |
| Sign-in | Google OAuth 2.0 Client ID | `VITE_GOOGLE_CLIENT_ID` (public by design) | JWT decode client-side, 1-hour session |
| Resume parse (PDF) | pdfjs-dist | ^4.4.168 | Lazy-loaded PDF text extraction + worker |
| Resume parse (DOCX) | mammoth | ^1.12.0 | Lazy-loaded DOCX raw-text extraction |
| Export (PDF) | jspdf | ^2.5.2 | Lazy-loaded client PDF generation |
| Export (DOCX) | docx | ^9.7.1 | Lazy-loaded client DOCX generation |
| Hosting (prod) | Vercel (auto-detect, no `vercel.json`) | `api/*.ts` → serverless functions | Production deployment |
| Hosting (dev) | Vite dev server | port 3000, host `0.0.0.0` | `npm run dev` |
| Fonts | Google Fonts | Instrument Sans + Source Serif 4 | Body / document serif |
| SEO | title, description, Open Graph, Twitter card, `og-image.png` | — | Discoverability |
| VCS | Git / GitHub | main branch | Trunk-based, 30 commits (2025-11-02 to 2026-09-24) |

---

## 3. Architecture (how it fits together)

- **Thin server proxy, rich client:** React SPA (`App.tsx` + 8 components + 2 services) calls two Vercel serverless functions — `api/openrouter.ts` (LLM) and `api/fetch-url.ts` (job-posting fetch) — so `OPENROUTER_API_KEY` never ships to the browser.
- **Dev vs prod split:** in development `vite.config.ts` injects the key from `.env.local` for direct OpenRouter calls; in production the bundle contains no key and all AI traffic goes through `/api/*`.
- **CORS fix by design:** posting URLs (LinkedIn etc.) are fetched server-side in `api/fetch-url.ts`, stripping `<script>/<style>` tags and returning up to 12,000 chars — bypassing browser CORS blocks.
- **Auth is a client-side gate:** Google JWT is `atob`-decoded in `services/auth.tsx` (`sub/name/email/picture/exp`), persisted as `covercraft_google_auth` in `localStorage`, restored until expiry (~1 hour). No server session, no `firebase-admin`, no per-request token verification — generation is gated by `isAuthenticated` in UI only.
- **State is local-first:** drafts (`drafts_local`) and theme (`theme`) live in `localStorage`; no database. Outputs render in a `65ch` centered document surface (`doc-surface`, always white).
- **Performance by lazy-loading:** `pdfjs-dist`, `mammoth`, `jspdf`, `docx` are all `import()`-loaded only when the user uploads or exports — keeping the initial bundle lean.

---

## 4. Feature inventory (technical depth for bullet generation)

1. **4 generation modes** — Standard (Balanced), Thinking Mode (deep reasoning for senior/complex roles), Low Latency (fastest draft), Search Grounding / From URL (reads posting from link); selecting URL input auto-forces Search Grounding and disables the selector.
2. **4 tones** — Professional, Enthusiastic, Confident, Creative — injected into the system prompt with per-tone definitions.
3. **Dual JD input** — pasted text (`textarea`) or posting URL (`type=url`); URL path server-fetches and strips HTML to 12k chars with graceful fallback to paste-text-on-failure.
4. **Resume upload + AI format** — PDF (`pdfjs-dist` + `pdf.worker.mjs`) and DOCX (`mammoth`) parsing via file `arrayBuffer()`; two buttons: raw upload vs AI-enhanced structure (`--- Headings ---`, blank lines, hyphen bullets) using Gemma 4.
5. **Prompt engineering** — career-coach system prompt (no placeholders, keywords + quantifiables from resume, single-letter output only) at `temperature 0.7`; separate researcher prompt for URL mode.
6. **Google sign-in gate** — `@react-oauth/google` popup (desktop) / sheet (mobile); header shows avatar/name/email + sign-out; unauthenticated users see a lock card (`Sign in to generate`) instead of the Generate button.
7. **Export suite** — one-click Copy (`clipboard` + 2s `Copied` check), PDF (`jsPDF`, `Cover_Letter_{Company}.pdf`), DOCX (`docx` `Document/Packer`, `Cover_Letter_{Company}.docx`), Save draft, Regenerate; output auto-linkifies `http(s)://` and `www.` URLs.
8. **Local drafts** — `crypto.randomUUID()` IDs, `companyName || Untitled Draft`, ISO timestamps, prepend + persist, click-to-load with smooth scroll, hover-delete, collapsible grid (`1/sm:2/lg:3`), count badge.
9. **Dark/light theme** — persisted, `dark`-class Tailwind variant, View-Transition wave (`0.9s` circle from toggle) + CSS ripple fallback, violet (`#6f43b0`) + teal (`#2e9c99`) token system, ambient radial washes.
10. **Responsive & accessible** — `max-w-5xl` container, `min-h-[100dvh]`, `viewport-fit=cover`, sticky blurred header, `Segmented` controls with `role=tablist/tab` + `aria-selected`, ≥44px targets, focus rings, `no-scrollbar` rails.
11. **SEO** — title `CoverCraft — Professional Cover Letter Writer`, description, OG + Twitter `summary_large_image`, canonical `og:url`, `og-image.png` (213 KB).
12. **Security posture** — key isolation (dev-only bundle injection, prod-only server env), server-side URL fetch with `User-Agent CoverCraft/1.0`, no secrets in `localStorage` (only Google JWT + drafts + theme).

---

## 5. Quality & testing

- **No automated test suite:** zero `*.test.*` / `*.spec.*`, no `test` script, no vitest/jest/playwright dependencies.
- **Gates that do exist:** `npm run typecheck` (`tsc --noEmit`, also first step of `npm run build`), `npm run build` (`tsc --noEmit && vite build`) → `dist/`.
- **Helpers not wired:** `PASTE- sandbox browser/visual-check.js` (278 lines) + `SANDBOX-BROWSER-VISUAL-TESTS.md` are untracked-helper docs, not in `package.json` scripts.
- **Docs in-repo:** `README.md`, `AGENTS.md` (implement-first, run/test only on explicit request), `bug and fixes summary/` protocol + template, this sheet.

---

## 6. Scale metrics (quantifiables)

- **37** git-tracked files; **~1,889 lines** across **18** TS/TSX/CSS files (11 `.tsx` = 1,264 lines, 6 `.ts` = 413 lines, 1 `.css` = 212 lines).
- **2 API endpoints** (`POST /api/openrouter`, `POST /api/fetch-url`) + **2 services** (`geminiService.ts` 285 lines, `auth.tsx` 152 lines) + **8 UI components**.
- **4 generation modes** × **4 tones** × **2 JD input types** = 16 generation paths from one prompt template family.
- **5 export/save actions** (Copy, PDF, DOCX, Save draft, Regenerate) with lazy-loaded heavy libs.
- **0** databases, **0** server auth checks — localStorage-only persistence.
- **4.4 MB** production `dist/` (largest chunk `pdf.worker` ~2.09 MB, lazy-loaded).
- **30 commits** on `main` (2025-11-02 to 2026-09-24).

---

## 7. Engineering practices worth mentioning

- Secret isolation — API key server-side in production, dev-only bundle injection, never persisted client-side.
- Server-side fetch to defeat CORS — LinkedIn-style postings read via `api/fetch-url.ts`, not the browser.
- Lazy-load heavy libs — PDF/DOCX parse + export libs split out of the initial bundle via dynamic `import()`.
- Local-first persistence — drafts/theme/auth in `localStorage` with expiry validation and shape guards.
- Graceful degradation — URL-fetch failure falls back to paste-text; resume-format failure falls back to raw text; missing Google Client ID renders an amber setup warning instead of crashing.
- Prompt discipline — single-letter output contract, no-placeholder rule, temperature-pinned, mode→model routing table.
- View-Transition theming — coordinate-driven wave with CSS ripple fallback and `prefers-reduced-motion` awareness via native VT.
- Trunk-based Git workflow; AI-assisted development governed by in-repo agent rules (`AGENTS.md`).

---

## 8. ATS / keyword tags

cover letter generator, AI writing assistant, resume parsing, job description parsing, React, React 19, Vite, TypeScript, Tailwind CSS v4, OpenRouter, LLM integration, prompt engineering, NVIDIA Nemotron, Google Gemma, serverless functions, Vercel, Google OAuth, JWT, localStorage persistence, PDF generation, DOCX generation, pdfjs, mammoth, jsPDF, responsive design, dark mode, accessibility (ARIA), SEO, Open Graph, Git/GitHub.

---

## 9. Ready-made examples (regenerate freely — facts only)

**Resume bullets:**
- Built an AI cover-letter builder (React 19, Vite 6, Tailwind v4, TypeScript) that drafts tailored letters from a resume plus pasted text or a posting URL via OpenRouter free models (Nemotron 3 Ultra/Super, Gemma 4).
- Designed a serverless proxy (`api/openrouter.ts`, `api/fetch-url.ts`) keeping `OPENROUTER_API_KEY` server-side and fetching job postings server-side to bypass CORS, returning up to 12k chars of cleaned text.
- Added PDF/DOCX resume upload (lazy-loaded `pdfjs-dist` + `mammoth`) with optional AI reformatting, plus 4 generation modes × 4 tones routed to distinct models at temperature 0.7.
- Implemented Google OAuth gating (`@react-oauth/google`, localStorage JWT with 1-hour expiry), local-first drafts (`crypto.randomUUID`, ISO timestamps), and one-click Copy/PDF (`jsPDF`)/DOCX (`docx`) export with linkified output.
- Shipped a responsive dark/light SPA (View-Transition theme wave, `Segmented` ARIA controls, `65ch` document surface) on Vercel with SEO/OG tags; `tsc --noEmit` + Vite build gates, zero-test local-first architecture.

**Resume project paragraph (3 lines):** AI cover-letter builder built with React 19, Vite, Tailwind v4 and TypeScript, deployed on Vercel with two serverless functions proxying OpenRouter free models. Features Google sign-in gating, PDF/DOCX resume upload with AI formatting, 4 generation modes × 4 tones, URL-based job fetching that bypasses CORS, and Copy/PDF/DOCX export with local drafts. Ships as a responsive dark/light SPA with lazy-loaded heavy libs and a 4.4 MB production bundle.

**Portfolio card (title + ~30 words + stack):** CoverCraft — paste your resume and any job post (or just its URL) to get a tailored cover letter in your chosen tone, then copy, download, or save drafts. Google sign-in, dark mode, instant export. `React · Vite · TypeScript · Tailwind · OpenRouter · Vercel`

**Tone/length guide for the AI:** resume = 3–5 dense bullets or one 3-line paragraph, lead with verbs and numbers, keywords from §8; portfolio = friendly paragraph + feature list + stack chips, mention the URL-fetch trick, the 4×4 mode/tone matrix, and local-first drafts; never claim a test suite, a database, or server-side auth — none exist.
