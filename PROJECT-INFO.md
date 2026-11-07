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
| Status | Production-deployed on Vercel, actively maintained (2026, version 2.0.5) |

**One-liners (pick by context):**
- *10 words:* AI cover-letter builder with verified Google auth and export suite.
- *25 words:* CoverCraft is a hardened React + Vite + Tailwind full-stack utility that drafts tailored cover letters via OpenRouter free models with server-side auth and SSRF defenses.
- *Elevator pitch:* CoverCraft turns your resume plus a job description — pasted text or a posting URL — into a tailored, professional cover letter. Sign in with Google (verified cryptographically server-side), pick a tone and generation mode, upload a PDF/DOCX resume with client-side parsing, review claims with the built-in factuality checklist, and export as PDF/DOCX or save local drafts. Endpoints are protected with rate limiting, server-owned prompts, and SSRF prevention; API keys never ship to the client.

---

## 2. Tech stack — exact versions

| Category | Technology | Version | Role |
|---|---|---|---|
| Runtime | Node.js | unpinned (Vite 6 requires Node 18+) | Build/dev runtime |
| Package manager | npm | lockfile `package-lock.json` | Dependencies/scripts |
| UI framework | React | ^19.2.0 | App UI (`App.tsx`, `components/`) |
| UI DOM | react-dom | ^19.2.0 | Rendering (`index.tsx`) |
| Build tool | Vite | ^6.2.0 | Dev server `:3000` with API middleware, production build |
| Vite plugin | @vitejs/plugin-react | ^5.0.0 | React Fast Refresh |
| Styling | Tailwind CSS | ^4.3.3 | Utility styling (`index.css` 234 lines) |
| Styling plugin | @tailwindcss/vite | ^4.3.3 | Vite integration |
| Language | TypeScript | ~5.8.2 | Type safety (`tsc --noEmit` gate) |
| AI gateway | OpenRouter chat completions | `https://openrouter.ai/api/v1/chat/completions` | All LLM calls via server-controlled proxy |
| AI models (free) | NVIDIA Nemotron 3 Ultra 550B | `nvidia/nemotron-3-ultra-550b-a55b:free` | Standard + URL modes |
| AI models (free) | NVIDIA Nemotron 3 Super 120B | `nvidia/nemotron-3-super-120b-a12b:free` | Thinking mode |
| AI models (free) | Google Gemma 4 26B | `google/gemma-4-26b-a4b-it:free` | Low-latency + resume-formatting modes |
| Auth (client) | @react-oauth/google | ^0.13.5 | Google sign-in button + `GoogleOAuthProvider` |
| Auth (server) | Node crypto (RSA-SHA256) | built-in | Server verification against Google JWKS |
| Resume parse (PDF) | pdfjs-dist | ^4.4.168 | Client-side lazy-loaded text extraction (max 10 pages) |
| Resume parse (DOCX) | mammoth | ^1.12.0 | Client-side lazy-loaded raw-text extraction |
| Export (PDF) | jspdf | ^2.5.2 | Lazy-loaded client PDF generation |
| Export (DOCX) | docx | ^9.7.1 | Lazy-loaded client DOCX generation |
| Rate limiting | Upstash Redis / Memory | REST API / in-memory | Sliding-window quotas by user `sub` and IP |
| Testing | tsx + node:test | ^4.19.2 / Node native | Automated test suite (`npm test`) |
| CI | GitHub Actions | `.github/workflows/ci.yml` | Typecheck, test, and build automation |
| Hosting (prod) | Vercel | `api/*.ts` → serverless functions | Production deployment |
| Hosting (dev) | Vite dev server | port 3000, host `0.0.0.0` | `npm run dev` with API parity middleware |
| Fonts | Google Fonts | Instrument Sans + Source Serif 4 | Body / document serif |

---

## 3. Architecture (how it fits together)

- **Server-enforced security boundary:** Both Vercel functions (`api/openrouter.ts` and `api/fetch-url.ts`) require a Google ID token in the `Authorization: Bearer` header. The server verifies signature against Google's public JWKS, validates audience, issuer, expiry, and subject, and enforces sliding-window rate limits by user `sub` and client IP.
- **SSRF defense on URL fetching:** `api/fetch-url.ts` enforces HTTPS only, rejects non-standard ports and credentials, resolves DNS, blocks private/loopback/cloud-metadata IPv4/IPv6 addresses (including `169.254.169.254`), follows manual redirects (max 3), enforces an 8s timeout, and limits streaming response bodies to 2 MB before extracting plain text (max 12,000 characters).
- **Server-owned prompt architecture:** `api/openrouter.ts` accepts structured payloads only (no client-supplied `system` prompts or arbitrary messages). Resume and job descriptions are enclosed in XML tags with explicit anti-injection instructions and strict factual grounding directives forbidding invented metrics or employers.
- **Client-side parsing privacy:** PDF and DOCX files are parsed in the browser via dynamic `import()`. The original files are never uploaded to any server.
- **Local-first draft persistence:** Drafts live in `localStorage` under `covercraft_drafts_v2` with legacy schema migration from `drafts_local`, quota recovery, and clear-all functionality.
- **Full dev/prod parity:** In development, Vite server middleware handles `/api/*` requests using the server handlers, ensuring `OPENROUTER_API_KEY` is never injected into the client bundle and avoiding CORS blocks on job URLs.

---

## 4. Feature inventory

1. **4 generation modes** — Standard (Balanced), Thinking Mode (deep reasoning for senior/complex roles), Low Latency (fastest draft), Search Grounding / From URL (reads posting from link).
2. **4 tones** — Professional, Enthusiastic, Confident, Creative — injected into server-controlled system prompts.
3. **SSRF-safe JD fetcher** — pastes text or URL; URL path safely fetches and strips HTML to 12k chars with comprehensive SSRF and redirect protection.
4. **Resume upload + AI format** — PDF and DOCX client-side parsing (5 MB cap, 10-page PDF limit, scanned document detection) with optional AI structuring using Gemma 4.
5. **Defensive prompt engineering** — strict prompt-injection defense with XML tags, career-coach persona, factual grounding rules (resume is single source of truth; no invented metrics), pinned temperature 0.7.
6. **User review checklist** — interactive 5-point "Review before sending" checklist to confirm role, candidate claims, metrics, and tone.
7. **Google sign-in boundary** — client sign-in with server-side cryptographic token verification against Google JWKS.
8. **Export suite** — one-click Copy, PDF (`jsPDF`), DOCX (`docx`), Save draft, Regenerate, with linkified output.
9. **Local drafts v2** — UUID keys, ISO timestamps, schema migration, quota recovery, clear-all action.
10. **Dark/light theme** — persisted preference, View-Transition wave from toggle, CSS ripple fallback.
11. **Automated test suite & CI** — tests for auth, SSRF, prompts, file validation, and storage; GitHub Actions CI pipeline.

---

## 5. Ready-made examples (regenerate freely — facts only)

**Resume bullets:**
- Engineered a full-stack AI cover-letter builder (React 19, Vite 6, Tailwind v4, TypeScript) deployed on Vercel with OpenRouter free-tier LLM routing (Nemotron 3 Ultra/Super, Gemma 4).
- Built a hardened serverless API proxy (`api/openrouter.ts`, `api/fetch-url.ts`) enforcing server-side Google ID token verification against Google JWKS and sliding-window rate limiting.
- Designed comprehensive SSRF defenses for web-based job fetching: DNS resolution, IPv4/IPv6 private/metadata IP blocking (`169.254.169.254`), manual redirect verification, 8s timeout, and 2 MB stream caps.
- Hardened prompt architecture against prompt injection and hallucination using XML data isolation, strict grounding rules, model allowlists, and a 5-point post-generation user review checklist.
- Added client-side resume intake (PDF/DOCX parsing up to 10 pages, scanned document detection), local-first draft storage with quota-exceeded auto-recovery, and an automated test suite with CI.

**Portfolio card (title + ~30 words + stack):** CoverCraft — paste your resume and any job posting (or link) to get a tailored cover letter. Features server-verified Google sign-in, SSRF-safe URL reading, prompt-injection defense, and local drafts. `React · Vite · TypeScript · Tailwind · OpenRouter · Vercel`
