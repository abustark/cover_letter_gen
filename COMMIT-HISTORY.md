# cover_letter_gen Commit Log

This document tracks every commit following the `2.0.x` versioning schema:

- Sequence: `2.0.1`, `2.0.2`, ..., `2.0.9`, `2.0.10` ➔ `2.1.0`, `2.1.1`, ..., `2.1.10` ➔ `2.2.0`, etc. The third number never exceeds `.10`.
- Format: `<version> - <short sentence>`
- **One version number per agent response / request batch** — not per issue, not per commit: a single owner request (even if it fixes many issues) consumes exactly ONE version number, multiple commits inside one response all take that same number (fold follow-up fixes into it — never burn a second number), and only a genuinely new owner request (a new response turn) advances the number.

> ### 📌 Next version — **keep this line current, every commit**
> - **`main` → `2.1.5`** (current head is `2.1.4` — see below)

---

## Commit History

### 2.1.4 - make serverless functions self-contained & add update notification toast

- **Date**: 2026-11-09
- **Why**: Vercel serverless runtime (`@vercel/node`) fails to resolve subdirectories inside `api/` (such as `api/_utils/`), resulting in runtime `FUNCTION_INVOCATION_FAILED` (HTTP 500) before reaching function handlers; add proactive update notification toast so users are prompted to refresh whenever a new deployment is published.
- **Changes**:
  - `api/openrouter.ts`: made 100% self-contained with zero local relative imports. Inlined Google token verification, sliding-window rate limiting, and prompt builders directly into the endpoint file. Eliminates all module resolution, path alias, and bundler stripping failures on Vercel.
  - `api/fetch-url.ts`: made 100% self-contained with zero local relative imports. Inlined Google token verification, rate limiting, and SSRF security validation.
  - `server/`: established clean dedicated server helper modules (`auth.ts`, `prompts.ts`, `rateLimiter.ts`, `urlSecurity.ts`) for offline unit testing, completely separated from the serverless deployment directory.
  - `components/UpdateNotification.tsx`: added lightweight version polling component that checks `/version.json` on interval and window focus/visibility; displays an editorial floating toast with "Refresh to Update" button whenever a newer build is deployed.
  - `public/version.json`: added deployment version metadata file.
  - `test/auth.test.ts`, `test/openrouter.test.ts`, `test/urlSecurity.test.ts`: updated imports to reference `../server/*`.
  - `tsconfig.json`: added `"server"` to `include` array.
  - `App.tsx`: integrated `<UpdateNotification />` and bumped footer version badge to `CoverCraft Studio v2.1.4`.

- **Date**: 2026-11-09
- **Why**: fix cramped resume text caused by single-space PDF extraction and silent failure in auto-format; repair Vercel serverless 500 invocation crash (`FUNCTION_INVOCATION_FAILED`) that was breaking cover letter generation on production; add heuristic resume structuring.
- **Changes**:
  - `api/_utils/`: moved serverless utility modules (`auth.ts`, `prompts.ts`, `rateLimiter.ts`, `urlSecurity.ts`) into `api/_utils/` with explicit `.ts` import extensions to fix Node ESM resolution (`ERR_MODULE_NOT_FOUND`) and prevent Vercel from deploying internal helper files as standalone public endpoints.
  - `api/openrouter.ts`: updated imports to `./_utils/*.ts`; expanded fallback pool to include `nvidia/nemotron-3.5-lightning:free` and `google/gemma-4-31b-it:free`; increased `max_tokens` from 2048 to 3072 to prevent reasoning token truncation; added fallback to `choices[0].text`.
  - `api/fetch-url.ts`: updated helper imports to `./_utils/*.ts`.
  - `services/resumeCleaner.ts`: added heuristic structuring utility `cleanCrampedResumeText` that identifies section headers (`EXPERIENCE`, `EDUCATION`, `SKILLS`, etc.), inserts double newlines, places bullet points (`•`, `●`, `▪`, etc.) onto new lines, isolates contact info, and normalizes spacing.
  - `components/InputSection.tsx`: refactored PDF text extraction to track Y coordinates and EOL markers rather than `.join(' ')`, preserving line breaks and paragraph spacing; applied `cleanCrampedResumeText` to both PDF and DOCX extractions; rewired `Auto-Format` button to format existing textarea content (with AI when authenticated and fallback to local clean when offline/unauthenticated) or open document picker if empty.
  - `services/geminiService.ts`: updated `formatResumeText` to throw descriptive error messages on API failure rather than silently swallowing errors and returning cramped text.
  - `test/auth.test.ts`, `test/openrouter.test.ts`, `test/urlSecurity.test.ts`: updated helper imports to `../api/_utils/*.ts`.
  - `App.tsx`: bumped footer version badge to `CoverCraft Studio v2.1.3`.

- **Date**: 2026-11-09
- **Why**: user instructed that no gate passes or test runs may be performed without explicit user proceed, and after every code update the AI must stop, summarize changes, and ask for permission before committing, pushing, or running gates.
- **Changes**:
  - `AGENTS.md`: added strict rules prohibiting gate passes, builds, typechecks, and test runs without explicit user proceed; added rule prohibiting automatic git commit and push after code updates; established standard order of operations to implement first, summarize, ask to commit/push, remind about tests, and wait for explicit acknowledgment.
  - `App.tsx`: bumped footer version badge to `CoverCraft Studio v2.1.2`.

### 2.1.1 - update free models & add resilient multi-tier fallback for OpenRouter

- **Date**: 2026-11-09
- **Why**: user reported generation error; investigation revealed OpenRouter retired `nvidia/nemotron-3-super-120b-a12b:free` (HTTP 404) and `google/gemma-4-26b-a4b-it:free` was experiencing upstream 429 rate limit errors from Google AI Studio's shared pool.
- **Changes**:
  - `api/utils/prompts.ts`: updated `ALLOWED_MODELS` and model routing matrix to deploy `nvidia/nemotron-3.5-super-vl:free` (1M context, 12B active MoE) for Thinking Mode and `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` (256k context, 30B-A3B) for Low Latency and resume text formatting. Retained `nemotron-3-ultra-550b-a55b:free` (1M context, 550B frontier model) for Standard and URL modes.
  - `api/openrouter.ts`: implemented automated multi-tier fallback chain across verified free models (`nemotron-3-ultra-550b-a55b:free` ⇄ `nemotron-3.5-super-vl:free` ⇄ `nemotron-3-nano-omni-30b-a3b-reasoning:free`). If an upstream model pool encounters a temporary 404, 429, 502, or 503 error, the handler automatically routes to the next candidate model, preventing user-facing generation failures.
  - `components/ModeSelector.tsx`: updated engine metadata and UI labels to display `Nemotron 3.5 Super VL` and `Nemotron 3 Nano Omni`.
  - `test/openrouter.test.ts`: updated test suite assertions to match new model routing specifications.
  - `App.tsx`: bumped footer version badge to `CoverCraft Studio v2.1.1`.
  - `PROJECT-INFO.md` & `README.md`: updated model routing tables, fallback chain documentation, and tech stack references.

### 2.1.0 - update PROJECT-INFO.md and repo documentation for Bun & v2.1.0 architecture

- **Date**: 2026-11-09
- **Why**: user requested updating repo files, documentation, and creating a comprehensive, up-to-date PROJECT-INFO.md source of truth for AI models to understand the project completely without reading code.
- **Changes**:
  - `PROJECT-INFO.md`: completely overhauled and expanded as the definitive source of truth; covers project identity (v2.1.0), Bun v1.4.4 toolchain, exact dependencies, high-end editorial design system, typography tokens (Playfair Display, Instrument Sans, Source Serif 4), Editorial Accent Hierarchy (`Input 01`, `Input 02`, `Config`, `Engine`, `Output 03`, `Archive 04`), native Google button architecture, avatar popover navigation, dual-mode authentication (RS256 JWKS + OAuth access token fallback), SSRF network defense matrix, server-owned prompt architecture with XML isolation, sliding-window rate limiting, client-side document privacy, model routing matrix, file directory map, Bun CLI reference, and verified portfolio/resume bullets.
  - `App.tsx`: bumped footer version badge to `CoverCraft Studio v2.1.0`.
  - `README.md`: updated getting started, stack table, features table, testing, and security model to reflect Bun toolchain (`bun install`, `bun run dev`, `bun test`, `bun run typecheck`, `bun run build`), native Google button, avatar popover menu, and dual-mode token verification.
  - `.github/workflows/ci.yml`: modernized CI pipeline to use `oven-sh/setup-bun@v2` with `bun install`, `bun run typecheck`, `bun test`, and `bun run build`.
  - `docs/PORTFOLIO-FRAMING.md`: updated portfolio card tags, resume bullets, and auth specifications to reflect Bun and server-verified Google authentication.

### 2.0.10 - switch toolchain to Bun and verify all gates and tests

- **Date**: 2026-11-07
- **Why**: user requested switching from npm to Bun for all tasks and executing the complete gates pass and test suite under Bun.
- **Changes**:
  - `package.json`: switched `"test"` script to `"bun test"`; modernized `"typecheck"` and `"build"` scripts to direct node bin execution for cross-runtime stability on Windows.
  - `scripts/inspect-ui.cjs`: updated target host binding to `127.0.0.1:3000` for deterministic local IPv4 connection under Chrome headless automation.
  - `api/utils/auth.ts`: optimized access token check to target `ya29.` Google OAuth tokens, ensuring malformed token formats fail fast and synchronously.
  - Gates passed:
    - `bun run typecheck`: TypeScript verification passed with 0 errors.
    - `bun test`: All 48 tests across 5 test suites passed cleanly with 0 failures.
    - `bun run build`: Production Vite bundle compiled in 58.3s with 0 errors.
    - Playwright inspection: Desktop and mobile viewports verified with 0 horizontal overflow and interactive dialog confirmation; screenshots saved to `artifacts/`.

### 2.0.9 - differentiate section headings, stack action icons & fix Google sign-in

- **Date**: 2026-11-07
- **Why**: user requested clear visual differentiation for section headings in font, size, placement, and colors; removing automatic Gmail ID leakage and centering Google Sign-In via native button (modeled after Linkly and ABot); and stacking icons vertically centered on top of action button text across the page.
- **Changes**:
  - `components/GoogleButton.tsx`: replaced Google's auto-personalized iframe with a clean, centered native button with the official 4-color Google G icon; supports `size="small"` (minimized inside the avatar collapse menu) and `size="large"` (centered in the unauthenticated empty card); eliminated automatic Gmail ID leakage and layout displacement.
  - `services/auth.tsx`: added `handleAccessToken` callback and hooked `google.accounts.id.disableAutoSelect()` into `signOut()` (modeled after ABot) to prevent sticky account locking.
  - `api/utils/auth.ts`: extended `verifyGoogleToken` to support both RS256 JWT ID tokens and Google OAuth access tokens via Google tokeninfo validation.
  - `components/Header.tsx`: centered and minimized the Google Sign-In button inside the avatar menu card (`size="small"`).
  - `components/InputSection.tsx`: stacked icons on top of text for `Upload Document`, `Auto-Format`, and `ExampleToggle` sample actions; centered sign-in card; added `Input 01 · Candidate Profile`, `Input 02 · Target Specification`, and `Config · Prose Stylistics` mono kickers with warm bronze indicator hierarchy.
  - `components/ModeSelector.tsx`: differentiated heading with `Engine · Model Pipeline` kicker and warm amber status badge.
  - `components/OutputSection.tsx`: differentiated heading with `Output 03 · Final Manuscript` kicker, emerald live indicator, and executive `Playfair Display` display typography; styled Factuality & Alignment Audit with emerald verified badge.
  - `components/DraftsSection.tsx`: differentiated heading with `Archive 04 · Local Repository` mono kicker and slate counter pill.
  - `components/icons.tsx`: added official 4-color `GoogleGIcon`.
  - `App.tsx`: bumped version badge to `v2.0.9`.

### 2.0.8 - add abufolio portfolio cta and Playfair Display font in footer

- **Date**: 2026-11-07
- **Why**: user requested adding the abufolio portfolio line and its Playfair Display font from the Linkly footer to CoverCraft's footer.
- **Changes**:
  - `index.html`: added `Playfair+Display:wght@400;600;700` to the Google Fonts stylesheet link.
  - `index.css`: added `--font-display` Playfair Display definition to `@theme` and styled `.foot-cta`, `.foot-cta-kicker`, `.foot-cta-link` with warm theme tokens, hover transitions, and dark mode support.
  - `App.tsx`: added the abufolio portfolio link block (`Like this build? There's more of my work` / `Open my portfolio ↗`) linking to `https://abufolio.vercel.app`; bumped footer version badge to `v2.0.8`.

### 2.0.7 - replace AI slop with editorial design & add avatar popover nav

- **Date**: 2026-11-07
- **Why**: user requested eliminating "AI slop" design (neon purple/teal gradients, sparkles, glowing badges) in favor of high-end editorial options, and fixing the mobile navbar Google Sign-In leakage using an avatar circle popover with embedded sign-in and theme toggle.
- **Changes**:
  - `index.css`: eliminated neon gradients and glowing mesh overlays; instituted a timeless editorial design system with obsidian (`#0c0c0d`), warm alabaster/parchment (`#faf9f5`), antique saddle bronze, and forest patina; redesigned tactile hardware `.double-bezel` containers and stationery paper surfaces.
  - `components/Header.tsx`: completely resolved mobile header nav bar button overflow by replacing raw Google OAuth buttons with a clean, unified avatar circle button (`#profile-menu-button`). Clicking opens an animated floating popover dialog (`role="dialog"`) with full Google Sign-In, profile details, sign out, and a tactile two-pill light/dark mode segmented toggle with outside-click and `Escape` dismissals.
  - `components/UI.tsx`: removed tacky purple gradient styling from primary CTA buttons in favor of commanding obsidian/chalk editorial buttons (`bg-stone-900 dark:bg-stone-100`); refined neutral stone segmented controls.
  - `components/icons.tsx`: added clean, minimalist SVG `UserIcon` for avatar fallback state.
  - `App.tsx`: replaced rainbow gradient headline with grotesque typography and italic serif emphasis (`em`); replaced sparkle pills with editorial mono badge `EDITORIAL STUDIO · FACTUALLY GROUNDED`; bumped version to `v2.0.7`.
  - `components/ModeSelector.tsx`: replaced sparkles with technical `Synthesis Engine` indicator and understated stone badge cards.
  - `components/InputSection.tsx`: upgraded inputs to warm stone borders; replaced tacky "AI format" pill with clean `Auto-Format` utility; refined privacy callout and unauthenticated empty state.
  - `components/OutputSection.tsx`: replaced rainbow foil gradient rule with subtle hairline divider; refined factuality checklist and letterhead stationery preview.
  - `components/DraftsSection.tsx`: replaced purple badges and multi-color gradient avatars with muted stone monogram tiles.
  - `scripts/inspect-ui.cjs`: updated automated Playwright inspection script to test the new `#profile-menu-button` popover dialog, theme switching, and desktop/mobile responsiveness.

### 2.0.6 - fix mobile and desktop UI misplacements verified with Playwright

- **Date**: 2026-11-07
- **Why**: user requested checking and fixing UI misplacements across desktop and mobile viewports with Playwright automation, followed by end-to-end interactive and gates testing.
- **Changes**:
  - `components/UI.tsx`: upgraded `Segmented` component with adaptive mobile responsive layout (`grid grid-cols-2 sm:flex` for 4 options and 2 options); eliminated horizontal clipping, word wrapping, and tab overflow.
  - `components/Header.tsx`: balanced responsive navbar layout on small viewports (<400px); prevented Google Sign-In and theme toggle collision; added `id="theme-toggle-btn"` and compact mobile brand badge.
  - `components/InputSection.tsx`: fixed squished `[ Text | URL ]` tab header by switching to responsive column-to-row flex; balanced "Upload PDF / DOCX" and "AI format" buttons to full container width on mobile; updated textarea typography to clean sans-serif; unified sample preview triggers.
  - `components/ModeSelector.tsx`: integrated responsive 2x2 grid for mobile tabs (`Standard`, `Thinking Mode`, `Low Latency`, `Search Grounding`); fixed label wrapping and improved contrast.
  - `components/OutputSection.tsx`: made floating action toolbar responsive with `flex-wrap` and compact icon-first labels on mobile; fixed checklist header wrapping; enhanced document sheet styling with warm ivory and rich dark stationery themes.
  - `components/DraftsSection.tsx`: ensured draft deletion button is accessible on touch screens without requiring desktop hover.
  - `index.css`: defined missing Tailwind v4 `--color-accent-950` and `--color-accent2-950` variables; optimized `.double-bezel` container padding for mobile; fixed dark-mode button contrast.
  - `App.tsx`: bumped version badge to `v2.0.6`; made footer metadata flex-wrap to prevent horizontal overflow; fixed hero eyebrow contrast.
  - `scripts/inspect-ui.cjs`: automated Playwright test suite capturing desktop & mobile (light, dark, interactive) and asserting zero horizontal page overflow.
  - `artifacts/`: saved desktop & mobile before/after and interactive screenshots in accordance with `AGENTS.md` Rule 4.
  - Verification: all 48 test suites passing (`npm test`), clean TypeScript check (`npm run typecheck`), production build succeeded (`npm run build`), and Playwright test suite exited with code 0.

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
