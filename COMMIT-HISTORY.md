# cover_letter_gen Commit Log

This document tracks every commit following the `2.0.x` versioning schema:

- Sequence: `2.0.1`, `2.0.2`, ..., `2.0.9`, `2.0.10` ➔ `2.1.0`, `2.1.1`, ..., `2.1.10` ➔ `2.2.0`, etc. The third number never exceeds `.10`.
- Format: `<version> - <short sentence>`
- **One version number per agent response / request batch** — not per issue, not per commit: a single owner request (even if it fixes many issues) consumes exactly ONE version number, multiple commits inside one response all take that same number (fold follow-up fixes into it — never burn a second number), and only a genuinely new owner request (a new response turn) advances the number.

> ### 📌 Next version — **keep this line current, every commit**
> - **`main` → `2.0.6`** (current head is `2.0.5` — see below)

---

## Commit History

### 2.0.5 - harden security, SSRF protection, agency visual redesign & tests

- **Date**: 2026-11-07
- **Why**: comprehensive security, reliability, SSRF protection, and factuality hardening per Product Completion Guide, plus agency-tier visual redesign and verification gates pass.
- **Changes**:
  - `api/utils/auth.ts`: implemented server-side cryptographic Google ID token verification against Google JWKS (`https://www.googleapis.com/oauth2/v3/certs`) checking signature, issuer, expiry with clock-skew tolerance, audience, and subject.
  - `api/utils/urlSecurity.ts`: comprehensive SSRF prevention for job-posting URL fetching (enforcing HTTPS, blocking non-standard ports and credentials, resolving DNS and blocking private/loopback/cloud-metadata IPv4/IPv6 addresses including `169.254.169.254`, manual redirect checking up to 3 hops, 8s timeout, 2 MB streaming byte cap, and HTML text cleanup).
  - `api/utils/rateLimiter.ts`: sliding-window rate limiter by verified user `sub` and client IP address; supports Upstash Redis / Vercel KV with in-memory fallback.
  - `api/utils/prompts.ts`: server-owned prompt templates with XML data encapsulation (`<candidate_resume>` and `<target_job_description>`), prompt-injection defense directives, anti-hallucination factual grounding rules, model allowlist, and mode/tone validation.
  - `api/openrouter.ts`: hardened proxy endpoint requiring Google ID token, applying rate limits, rejecting arbitrary `messages`/`model` contracts, and mapping upstream errors (429/502) with redacted logs.
  - `api/fetch-url.ts`: hardened URL endpoint requiring Google ID token, applying rate limits, and executing SSRF-safe URL fetching.
  - `vite.config.ts`: added local development server middleware routing `/api/*` requests through server handlers for complete development-to-production parity without exposing API keys to the client bundle.
  - `services/auth.tsx`: updated AuthContext to manage token lifecycle, monitor expiry, and expose active credentials for API calls.
  - `services/geminiService.ts`: converted to pure authenticated client calling server `/api/*` endpoints; eliminated all direct browser calls to OpenRouter and third-party URLs.
  - `components/Header.tsx`: transformed into a floating detached glass island navbar with refined brand monogram (`C`), PRO badge, verified user status chip, and tactile theme switcher.
  - `components/UI.tsx`: upgraded button system with button-in-button trailing icon badges, micro-scale tactile feedback (`active:scale-[0.98]`), concentric radii, and polished segmented tab controls.
  - `components/ModeSelector.tsx`: overhauled model intelligence strip with model badges (Recommended, High Precision, Fastest, Web Grounded), hardware-style segmented pills, and contextual model descriptors.
  - `components/InputSection.tsx`: implemented double-bezel concentric container architecture for candidate resume, target job, and tone selectors; added drag-and-drop resume intake (5 MB cap, 10-page limit, scanned document detection) with word-count indicators and sample previewers.
  - `components/OutputSection.tsx`: transformed document preview into an executive stationery letterpress surface with realistic paper drop-shadow (`doc-surface-card`), top gradient foil accent rule, floating action toolbar island, and progress-tracked pre-flight factuality checklist.
  - `components/DraftsSection.tsx`: upgraded local drafts library into an elegant masonry grid with company monogram tiles, formatted dates, line excerpts, and hover micro-interactions.
  - `services/draftStorage.ts`: implemented schema v2 with migration from `drafts_local`, quota recovery, and clear-all action.
  - `index.css`: added multi-layer atmospheric radial mesh lighting (`.bg-ambient`), concentric curves, double-bezel utilities, and luxury document paper shadow profiles.
  - `App.tsx`: updated hero section with high-contrast headline, optical eyebrow badge, and balanced layout rhythm.
  - `test/`: added comprehensive automated test suite covering auth, SSRF, prompts, drafts, and file validation (48 tests passing).
  - `package.json` & `.github/workflows/ci.yml`: added `npm test` script and GitHub Actions CI workflow.
  - `README.md` & `PROJECT-INFO.md`: updated documentation, architecture, security model, and metrics.

### 2.0.4 - remove stale snapshot and unused AI Studio metadata

- **Date**: 2026-10-26
- **Why**: owner asked to delete the local review snapshot and `metadata.json` if they were not needed.
- **Changes**:
  - `covercraft-review/` — deleted from disk (346 KB, untracked, gitignored duplicate of the app; no `.git`, no unique files).
  - `metadata.json` — deleted (tracked; AI Studio artifact, referenced by nothing — not Vite, the app, Vercel, or the docs).
  - `.gitignore`: dropped the now-obsolete `covercraft-review/` rule; `artifacts/` stays ignored.
  - `PROJECT-INFO.md`: tracked-file count `42` → `41`; commit count refreshed.

### 2.0.3 - real app screenshots as README hero; remove key-writing launcher

- **Date**: 2026-10-26
- **Why**: owner flagged two issues from 2.0.2 — the README hero was the OG banner rather than the product, and `start-ai.bat` wrote a plaintext API key into the repo root.
- **Changes**:
  - `README.md`: hero replaced with real captures of the running app (light + dark, 1440×1750) at `docs/assets/`; dark-mode screenshot linked below the hero.
  - `start-ai.bat`: **deleted** — it wrote `.opencode.json` (containing `OPENROUTER_API_KEY`) to the working directory; OpenCode's own auth/config replaces it.
  - `.gitignore`: `artifacts/` added (local working images, still required by `AGENTS.md` rule 4).
  - Captures also copied to `artifacts/` as `covercraft-home-light.png` / `covercraft-home-dark.png`.

### 2.0.2 - repo polish: README, LICENSE, docs/ layout

- **Date**: 2026-10-26
- **Why**: owner request — item 2 of the portfolio plan (repo polish), plus a request to organize the repo files cleanly.
- **Changes**:
  - `README.md`: rewritten — hero + live demo, feature table, architecture diagram, endpoint and model-routing tables, stack, project layout, setup/deploy, an explicit security model (what *is* and *isn't* protected), status/limitations, docs index, license.
  - `LICENSE`: added — all rights reserved, source available for viewing/evaluation only.
  - `docs/`: `bug and fixes summary/` → `docs/bugs-and-fixes/`, `PASTE- sandbox browser/` → `docs/sandbox-browser/`, `PORTFOLIO-FRAMING.md` → `docs/PORTFOLIO-FRAMING.md` (all `git mv`, history preserved).
  - References updated in `PROJECT-INFO.md` and `docs/bugs-and-fixes/BUGS-AND-FIXES.template.md`.
  - `.gitignore`: ignore `.env` and `.opencode.json` (the latter is written with a live key by `start-ai.bat`).
  - `PROJECT-INFO.md`: tracked-file/commit counts and last-commit date refreshed.
  - GitHub repo metadata: description set, 12 topics added (done via `gh repo edit`; not a file change).

### 2.0.1 - portfolio framing for an AI engineering audience

- **Date**: 2026-10-26
- **Why**: owner wants CoverCraft positioned on abufolio for a Data & Analytics / Applied AI audience; the current card leads with "AI-powered" and reads as a UI wrapper, not an engineering build.
- **Changes**:
  - `PORTFOLIO-FRAMING.md`: positioning doc — category→mechanism rule, four-beat reading order, feature→mechanism translation table, paste-ready abufolio card block (eyebrow/title/body/tags), three resume bullets, honest role-fit map, word rules, and the limitations deferred to the case notes.
  - No application code touched; card implementation stays in the abufolio repo.

### 2.0.0 - adopt versioned commits + universal COMMIT-HISTORY.md log

- **Date**: 2026-10-17
- **Why**: owner directive — every repo carries the same recognizable commit-log file name (`COMMIT-HISTORY.md`, repo root); numbering starts at `2.0.0` (history before this commit is unversioned).
- **Changes**:
  - `AGENTS.md`: "Commit Naming & Versioning (strict)" section — `2.0.x` schema with `.10` roll-over, one version per agent response / request batch, commits logged in `COMMIT-HISTORY.md`.
  - `COMMIT-HISTORY.md`: created at the repo root (same universal name in every project).
