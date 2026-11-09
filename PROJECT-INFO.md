# CoverCraft — Project Info Sheet (Definitive Source of Truth)

> **Purpose:** Every architectural fact, security contract, design specification, and technical parameter an AI model (or developer) needs to completely understand CoverCraft without reading the underlying code. Generate all portfolio summaries, resume bullets, and technical assessments strictly from these facts; do not invent beyond them.

---

## 1. Project Identity & Status

| Field | Value |
|---|---|
| Name | **CoverCraft — AI Cover Letter Builder & Editorial Studio** |
| Current Version | **v2.1.1** (Production release, November 2026) |
| App Type | Full-stack web application (AI document pipeline & career productivity studio) |
| Author | ABu (`abustark` on GitHub) |
| Live Site | https://coverltr.vercel.app/ |
| Source Repository | https://github.com/abustark/cover_letter_gen |
| Status | Production-deployed on Vercel, fully tested under Bun, actively maintained |
| License | All rights reserved (private copyright `© ABu`) |

### One-Liners & Positioning (by audience)
- **10 Words:** AI cover-letter studio with server-verified Google auth and export suite.
- **25 Words:** CoverCraft is an editorial React 19 + Bun + Vite full-stack application that crafts tailored, factually grounded cover letters using free OpenRouter frontier models with SSRF and prompt defenses.
- **Elevator Pitch:** CoverCraft bridges the gap between raw candidate credentials and tailored employer expectations. By accepting a PDF/DOCX resume (parsed entirely in-browser) and a job description (either pasted text or fetched via a server-side SSRF-hardened reader), CoverCraft synthesizes professional, high-conviction application letters. The pipeline is guarded by a server-side cryptographic Google authentication boundary (RS256 JWKS + OAuth access token support), sliding-window rate limiters, strict XML prompt-injection isolation, and a post-generation factuality checklist. No third-party LLM API keys ever touch client bundles, and candidate documents are never stored on external servers.
- **Engineering Framing:** An applied AI document processing pipeline featuring client-side AST/binary extraction (`pdfjs-dist`, `mammoth`), serverless CORS/SSRF mitigation, a multi-model routing matrix (3 free LLMs across 4 modes and 4 tones), and local-first persistence without database overhead.

---

## 2. Tech Stack & Exact Dependencies

| Category | Technology | Version | Purpose & Architecture Role |
|---|---|---|---|
| **Package Manager & Toolchain** | **Bun** | **v1.4.4** | Primary package manager, script runner, and native test runner (`bun.lock`, `bun test`, `bun run dev`, `bun run build`, `bun run typecheck`) |
| **Runtime Engine** | Node.js / Bun | Node 18+ / 20 LTS | Build and serverless execution runtime; full dev-to-prod API parity |
| **UI Framework** | React | `^19.2.0` | Declarative component UI tree (`App.tsx`, `components/`) |
| **DOM Renderer** | react-dom | `^19.2.0` | Browser DOM mount and reconciliation (`index.tsx`) |
| **Build Tool** | Vite | `^6.2.0` | Dev server on `0.0.0.0:3000` with native API middleware; production bundler |
| **Vite React Plugin** | @vitejs/plugin-react | `^5.0.0` | React 19 Fast Refresh & JSX transformation |
| **Styling Engine** | Tailwind CSS | `^4.3.3` | Utility styling with CSS theme tokens (`index.css`) |
| **Tailwind Vite Plugin** | @tailwindcss/vite | `^4.3.3` | Native lightning-fast Tailwind v4 compiler integration |
| **Type System** | TypeScript | `~5.8.2` | Strict compile-time typing (`node ./node_modules/typescript/bin/tsc --noEmit` gate) |
| **AI Gateway** | OpenRouter Chat API | REST `/v1/chat/completions` | Proxied through serverless endpoint (`api/openrouter.ts`) with multi-tier fallback; keys never leak |
| **AI Model (Standard & URL)** | NVIDIA Nemotron 3 Ultra 550B | `nvidia/nemotron-3-ultra-550b-a55b:free` | 1M context, frontier reasoning for general and senior roles |
| **AI Model (Thinking Mode)** | NVIDIA Nemotron 3.5 Super VL | `nvidia/nemotron-3.5-super-vl:free` | 1M context, 12B active MoE deep reasoning model for executive and leadership roles |
| **AI Model (Fast & Formatting)**| NVIDIA Nemotron 3 Nano Omni | `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | 256k context, 30B-A3B low-latency drafting and structured resume text formatting |
| **Auth (Client)** | @react-oauth/google | `^0.13.5` | Google Identity Provider wrapping native button & `useGoogleLogin` popup |
| **Auth (Server)** | Node `crypto` & JWKS | Built-in | RSA-SHA256 signature verification via Google JWKS + tokeninfo fallback |
| **Resume Extraction (PDF)**| pdfjs-dist | `^4.4.168` | Lazy-loaded client-side text extractor (max 10 pages; scanned image detection) |
| **Resume Extraction (DOCX)**| mammoth | `^1.12.0` | Lazy-loaded client-side raw document text extractor |
| **Export (PDF)** | jspdf | `^2.5.2` | Lazy-loaded client-side PDF document generator |
| **Export (DOCX)** | docx | `^9.7.1` | Lazy-loaded client-side Word document generator (Paragraph/TextRun AST) |
| **Rate Limiting** | Custom sliding-window | In-memory / Upstash Redis | Per-user `sub` and per-IP sliding-window quota management |
| **Testing Engine** | Bun Test | `bun test` (native) | 48 automated tests across 5 test suites (`test/*.test.ts`) |
| **E2E / Visual QA** | Playwright | CLI / headless | Headless browser assertions verifying 0 horizontal overflow on PC & mobile |
| **CI Automation** | GitHub Actions | `.github/workflows/ci.yml`| Automated workflow with `oven-sh/setup-bun@v2`, typecheck, test, and build |
| **Hosting (Production)** | Vercel Serverless | `@vercel/node ^5.5.13` | Edge/serverless deployment (`api/openrouter.ts`, `api/fetch-url.ts`) |
| **Typography** | Google Fonts | Web CDN | `Instrument Sans` (UI), `Source Serif 4` (letter), `Playfair Display` (headings) |

---

## 3. High-End Editorial Design System & Visual Architecture

CoverCraft v2.1.0 completely abandons generic "AI slop" (neon violet/cyan gradients, glowing buttons, floating sparkles, and decorative noise) in favor of a timeless, high-end editorial and typography-forward aesthetic.

### 3.1 Design Palette & Theme Tokens
- **Obsidian Dark Mode (`#0c0c0d` / `bg-stone-950`):** Rich, tactile, deep charcoal backdrop with subtle warm stone undertones.
- **Warm Alabaster Light Mode (`#faf9f5` / `bg-[#faf9f5]`):** High-grade stationery paper tone reminiscent of physical letterpress paper.
- **Concentric Double-Bezel Architecture (`.double-bezel` & `.double-bezel-inner`):** Tactile hardware framing with nested border radiuses and soft interior drop-shadows.
- **Stationery Paper Sheet (`.doc-surface-card`):** Realistic letterpress paper profile featuring a physical paper drop shadow, subtle hairline rules, and high-readability serif typesetting.
- **View Transition Waves:** Seamless theme toggle transitions utilizing the browser `document.startViewTransition()` API with a concentric coordinate origin (`--theme-x`, `--theme-y`) and a CSS ripple fallback.

### 3.2 Editorial Accent Hierarchy (Section Differentiation)
Every major functional quadrant on the page is visually differentiated using dedicated kicker tags, status indicators, and distinct font/color combinations:
1. **`Input 01 · Candidate Profile` (Resume Ingestion):**
   - Heading Kicker: Antique saddle / warm bronze monospace tag (`text-amber-700 dark:text-amber-400`).
   - Bullet Indicator: Solid amber accent (`bg-amber-600 dark:bg-amber-500`).
   - Action Buttons: Vertically stacked layout (icon centered on top, text centered below) for `Upload Doc` and `Auto-Format`.
2. **`Input 02 · Target Specification` (Job Opportunity):**
   - Heading Kicker: Antique bronze monospace tag (`text-amber-700 dark:text-amber-400`).
   - Bullet Indicator: Solid amber accent with responsive segmented control (`Text` vs `URL`).
3. **`Config · Prose Stylistics` (Tone Engine):**
   - Heading Kicker: Stone monospace tag (`text-stone-500 dark:text-stone-400`).
   - Segmented Controls: 4 options (`Professional`, `Enthusiastic`, `Confident`, `Creative`).
4. **`Engine · Model Pipeline` (Model Routing):**
   - Heading Kicker: Amber monospace tag (`Engine · Model Pipeline`).
   - Status Badge: Contextual pill (`Recommended`, `High Precision`, `Fastest`, `Web Grounded`).
   - Pipeline Cards: 4 model routing options with technical latency and parameter descriptors.
5. **`Output 03 · Final Manuscript` (Document Studio):**
   - Heading Kicker: Forest patina / emerald monospace tag (`text-emerald-700 dark:text-emerald-400`).
   - Live Status: Emerald pulse ring with `Live Synthesis` badge.
   - Display Typography: Styled in `font-display font-bold` (**Playfair Display**).
   - Stationery Surface: Letterpress paper surface (`.doc-surface-card`) with floating action toolbar island (Save Draft, Copy, PDF, DOCX, Regenerate).
   - Factuality & Alignment Audit: Interactive 5-point checklist with live progress tracking ring.
6. **`Archive 04 · Local Repository` (Drafts Library):**
   - Heading Kicker: Slate monospace tag (`Archive 04 · Local Repository`).
   - Counter Badge: Muted stone counter pill with company monogram tiles and one-click restoration.

### 3.3 Typography Stack
- **UI & Controls:** `Instrument Sans`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`. Clean, highly readable, grotesque letterforms.
- **Manuscript Reading:** `Source Serif 4`, `Georgia`, `Cambria`, `serif`. Editorial document formatting calibrated for long-form reading comfort.
- **Executive Display:** `Playfair Display`, `serif`. Elegant, high-contrast serif applied to manuscript headings, hero brand accents, and the footer portfolio link.
- **Technical Kickers & Badges:** `JetBrains Mono`, `SF Mono`, `Menlo`, `monospace`. High-density technical metadata tags.

---

## 4. Authentication & Navigation Architecture

### 4.1 Native Google Button (Anti-Displacement & Anti-Leakage)
Earlier versions relied on Google's default iframe (`<GoogleLogin />`), which automatically injected personalized Gmail account IDs on mobile and created severe layout shifts and header leakage.
- **v2.1.0 Architecture:** Built with a custom native component (`components/GoogleButton.tsx`) powered by `@react-oauth/google`'s `useGoogleLogin()` popup hook.
- **Visual Design:** Centered, border-stabilized button featuring the official 4-color Google "G" SVG icon.
- **Variants:**
  - `size="small"`: Compact, full-width design nested cleanly inside the avatar dropdown menu.
  - `size="large"`: Commanding, centered CTA button situated inside the unauthenticated empty state card.
- **Privacy & Layout Stability:** Zero iframe personalization, zero premature Gmail ID rendering, and 100% predictable CSS box model dimensions.

### 4.2 Unified Avatar Circle Navigation (`#profile-menu-button`)
- Desktop & Mobile header navbar incorporates a unified circular avatar button (`components/Header.tsx`).
- When authenticated: Displays the user's high-resolution Google profile picture (with fallback to a clean `UserIcon` SVG).
- When unauthenticated: Displays an understated guest profile monogram.
- **Floating Popover Dialog:** Clicking the avatar opens an animated popover dialog (`role="dialog"`) that features:
  - User identity badge (Name, Email, verified status chip).
  - Compact native Google Sign-In or Sign-Out action.
  - Tactile light/dark segmented toggle.
  - Outside-click detection and keyboard `Escape` dismissal handlers.
- **Sticky Account Lock Prevention:** Sign-out calls `google.accounts.id.disableAutoSelect()`, preventing Google from automatically forcing re-login with the same account.

---

## 5. Security & Defensive Engineering Boundary

CoverCraft enforces strict defense-in-depth across every layer of the application.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BROWSER CLIENT (React 19)                       │
│  - Resume Parsing: In-memory via pdfjs-dist / mammoth (0 server upload)│
│  - Auth Trigger: useGoogleLogin OAuth popup                            │
│  - Export Engine: Client-side jsPDF / docx                             │
│  - Persistence: localStorage (UUID keys, auto quota recovery)         │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
    HTTPS POST      │ Authorization: Bearer <token>  │ HTTPS POST
    /api/openrouter │ (Google ID / OAuth token)      │ /api/fetch-url
                    ▼                                ▼
┌───────────────────────────────────────┐ ┌──────────────────────────────┐
│       API: /api/openrouter.ts         │ │     API: /api/fetch-url.ts   │
│ 1. Verify Google Token (JWKS RS256)   │ │ 1. Verify Google Token       │
│ 2. Sliding Rate Limit (User & IP)     │ │ 2. Sliding Rate Limit        │
│ 3. Payload Validation & Size Caps     │ │ 3. SSRF & DNS Blacklist Check│
│ 4. Server-Owned Prompts & XML Fence   │ │ 4. Bounded Manual Redirects  │
│ 5. Model Routing Allowlist            │ │ 5. 2 MB Stream Cap & Cleanup │
└───────────────────┬───────────────────┘ └──────────────┬───────────────┘
                    │                                    │
                    ▼                                    ▼
       OpenRouter Chat Completions             Target Career Website
      (Key safe in Vercel Env)                 (HTTPS Port 443 Only)
```

### 5.1 Dual-Mode Server Token Verification (`api/utils/auth.ts`)
All serverless endpoints (`/api/openrouter` and `/api/fetch-url`) mandate a valid Google Bearer token:
1. **Primary Route (RS256 JWT ID Token):**
   - Automatically fetches and caches Google's public JWKS keys from `https://www.googleapis.com/oauth2/v3/certs`.
   - Parses the 3-part JWT header, payload, and cryptographic signature.
   - Verifies RSA-SHA256 signature using Node's built-in `crypto.createVerify('RSA-SHA256')`.
   - Checks issuer (`accounts.google.com` or `https://accounts.google.com`).
   - Checks expiry with a 60-second clock-skew tolerance buffer.
   - Validates audience matches configured `GOOGLE_CLIENT_ID` or `VITE_GOOGLE_CLIENT_ID`.
   - Extracts verified user subject `sub`.
2. **Fallback Route (Google OAuth Access Token):**
   - Recognizes OAuth access tokens prefixed with `ya29.`.
   - Validates token against `https://oauth2.googleapis.com/tokeninfo?access_token=...`.
   - Confirms audience validity and extracts user subject ID.
   - Fails fast on malformed tokens, rejecting bad formats with HTTP 401.

### 5.2 SSRF Prevention & Safe URL Fetching (`api/utils/urlSecurity.ts`)
When candidates supply a job URL instead of raw text, `/api/fetch-url` applies rigorous SSRF protections:
- **HTTPS Enforcement:** Only the `https:` protocol is permitted; plain HTTP and other schemes are rejected.
- **Port Restriction:** Only standard TLS port `443` is allowed.
- **No In-URL Credentials:** Rejects URLs with embedded user/pass (`https://user:pass@host`).
- **Hostname Blacklist:** Disallows `localhost`, `*.localhost`, `*.local`, `*.internal`, `*.lan`, `metadata.google.internal`, and `instance-data`.
- **DNS Resolution & IP Blacklisting:** Resolves target hostname via `dns.promises.lookup()` and validates every resolved address:
  - Loopback (`127.0.0.0/8`, `::1`)
  - Private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)
  - Cloud metadata / APIPA (`169.254.0.0/16`, specifically AWS/GCP metadata endpoint `169.254.169.254`)
  - Broadcast (`255.255.255.255`)
  - Carrier-grade NAT (`100.64.0.0/10`)
  - Documentation blocks (`192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`)
  - IPv6 Unique Local (`fc00::/7`) and Link-Local (`fe80::/10`)
- **Manual Bounded Redirects:** Automatically prevents redirect smuggling by intercepting HTTP 301/302/303/307/308 responses; re-runs DNS and IP verification on each hop (maximum 3 redirects).
- **Hard Timeout:** 8000 ms (8s) maximum fetch duration via `AbortController`.
- **Streaming Byte Cap:** Enforces a strict 2 MB maximum transfer ceiling; aborts response stream immediately if exceeded.
- **Content Cleaning:** Strips `<script>`, `<style>`, HTML comments, and tags; decodes HTML entities; caps extracted plain text at 12,000 characters (`MAX_JOB_URL_TEXT_LENGTH`).

### 5.3 Server-Owned Prompt Architecture & Anti-Hallucination (`api/utils/prompts.ts`)
- **Zero Client Prompt Injection:** Client cannot supply system prompts or custom messages arrays.
- **Data Encapsulation:** Untrusted candidate resumes and job postings are isolated inside dedicated XML tags:
  ```xml
  <candidate_resume>
  ... untrusted candidate text ...
  </candidate_resume>

  <target_job_description>
  ... untrusted job posting text ...
  </target_job_description>
  ```
- **Factual Grounding Directives:**
  - The resume is established as the sole single source of truth.
  - The model is strictly prohibited from inventing employers, degrees, metrics, or technologies not present in `<candidate_resume>`.
  - System commands instruct the model to ignore any embedded directives or prompt-hijacking attempts contained within the input tags.
  - Temperature is pinned at `0.7` for consistency and adherence.
  - Zero placeholders rule: Disallows brackets like `[Your Name]` or `[Company]`.

### 5.4 Sliding-Window Rate Limiting (`api/utils/rateLimiter.ts`)
Protects upstream inference budgets and serverless compute from abuse:
- `/api/openrouter`: 15 requests per 10 minutes per verified user `sub`; 30 requests per 10 minutes per client IP.
- `/api/fetch-url`: 20 requests per 10 minutes per verified user `sub`; 40 requests per 10 minutes per client IP.
- Supports Upstash Redis / Vercel KV REST APIs for distributed state, with automatic in-memory fallback.

### 5.5 Document Privacy & Client-Side Extraction
- PDF parsing runs in-browser via `pdfjs-dist` (up to 10 pages). Password-protected and scanned image-only PDFs (<50 characters of selectable text) trigger informative alerts.
- DOCX parsing runs in-browser via `mammoth`.
- Uploaded candidate documents are **never** transmitted to or stored on any server. Only extracted plain text is sent to the generation proxy.

---

## 6. Model Pipeline & Routing Matrix

| Generation Mode | Model ID | Context Window | Architecture Role |
|---|---|---|---|
| **Balanced Engine (Standard)** | `nvidia/nemotron-3-ultra-550b-a55b:free` | 1,000,000 tokens | Frontier reasoning (550B total / 55B active); balanced eloquence and factual precision for general & senior roles |
| **Deep Reasoning Mode (Thinking)** | `nvidia/nemotron-3.5-super-vl:free` | 1,000,000 tokens | MoE deep reasoning architecture (12B active) for executive, principal, and cross-functional leadership roles |
| **Quick Draft (Low Latency)** | `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | 256,000 tokens | Ultra-fast 30B-A3B drafting model designed for rapid iteration in <1 second |
| **URL Reader Engine (Search Grounding)** | `nvidia/nemotron-3-ultra-550b-a55b:free` | 1,000,000 tokens | Massive 1M context model ideal for digesting full scraped job posting web pages |
| **Resume Formatting Utility** | `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | 256,000 tokens | Organizes messy raw resume text into clean, structured sections in <0.5 seconds |

### 6.1 Multi-Tier Resilient Fallback Chain
To protect users from temporary upstream provider rate-limits (HTTP 429) or model retirements (HTTP 404), `api/openrouter.ts` implements an automated fallback mechanism across the verified free model pool:
- Primary chain: `nvidia/nemotron-3-ultra-550b-a55b:free` ⇄ `nvidia/nemotron-3.5-super-vl:free` ⇄ `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`.
- If a chosen model is temporarily congested or returns 404/429/502/503, the serverless handler automatically routes the identical payload to the next candidate before returning an error to the user.

---

## 7. Project File & Directory Map

```
cover_letter_gen/
├── .github/
│   └── workflows/
│       └── ci.yml                 # CI workflow (Bun setup, typecheck, test, build)
├── api/                           # Vercel Serverless Functions
│   ├── fetch-url.ts               # SSRF-safe job posting URL scraper
│   ├── openrouter.ts              # Authenticated OpenRouter AI generation proxy
│   └── utils/
│       ├── auth.ts                # Dual-mode Google token verification (JWKS & tokeninfo)
│       ├── prompts.ts             # Server-owned prompts, XML isolation, model allowlist
│       ├── rateLimiter.ts         # Sliding-window rate limiting (User & IP)
│       └── urlSecurity.ts         # SSRF prevention, DNS check, IP blacklist, HTML stripper
├── components/                    # React UI Components
│   ├── DraftsSection.tsx          # Local drafts repository with monogram tiles
│   ├── GoogleButton.tsx           # Custom native Google button (small & large, 4-color SVG)
│   ├── Header.tsx                 # Detached glass island navbar with avatar circle popover
│   ├── icons.tsx                  # Minimalist SVG icons (GoogleGIcon, UserIcon, etc.)
│   ├── InputSection.tsx           # Resume & JD inputs, stacked icon buttons, dropzone
│   ├── ModeSelector.tsx           # Synthesis engine model selector with status badges
│   ├── OutputSection.tsx          # Stationery manuscript, action island, 5-point audit
│   └── UI.tsx                     # Reusable UI primitives (Segmented, Field, Button)
├── docs/                          # Architecture & Portfolio Documentation
│   ├── assets/                    # Light & dark mode application previews
│   ├── bugs-and-fixes/            # Bug logging protocols and templates
│   ├── sandbox-browser/           # Playwright visual check kit & scripts
│   └── PORTFOLIO-FRAMING.md       # High-conviction positioning copy for portfolio/resume
├── scripts/
│   └── inspect-ui.cjs             # Playwright automated E2E & 0-overflow inspection
├── services/                      # Client Services
│   ├── auth.tsx                   # AuthContext, GoogleOAuthProvider, token lifecycle
│   ├── draftStorage.ts            # Local-first storage (v2 schema, quota recovery, migration)
│   └── geminiService.ts           # Authenticated API client calling /api/* endpoints
├── test/                          # Automated Bun Test Suite (48 tests)
│   ├── auth.test.ts               # JWKS signature, expiry, audience, access token tests
│   ├── draftStorage.test.ts       # Storage v2 schema, migration, quota recovery tests
│   ├── fileValidation.test.ts     # PDF/DOCX file limits and scanned detection tests
│   ├── openrouter.test.ts         # Model routing, prompt injection, XML tags, rate tests
│   └── urlSecurity.test.ts        # SSRF IP blacklists, DNS resolution, redirect tests
├── App.tsx                        # Root application component & theme management
├── bun.lock                       # Bun dependency lockfile
├── index.css                      # Tailwind v4 theme, double-bezel, and stationery CSS
├── index.html                     # HTML entry point with Google Fonts preload
├── index.tsx                      # React root mount
├── package.json                   # Project manifest, scripts, and dependencies
├── vite.config.ts                 # Vite config with dev-server API proxy middleware
├── AGENTS.md                      # Mandatory AI agent operational rules & versioning
├── COMMIT-HISTORY.md              # Exhaustive chronological commit history & version log
├── PROJECT-INFO.md                # THIS FILE (Comprehensive source of truth)
└── README.md                      # Public GitHub documentation
```

---

## 8. CLI & Developer Reference (Bun First)

All development, testing, and compilation tasks run through **Bun**:

```bash
# 1. Install dependencies
bun install

# 2. Start local development server with API parity middleware (:3000)
bun run dev

# 3. Execute strict TypeScript typecheck (0 errors required)
bun run typecheck

# 4. Run automated test suite (48 tests across 5 test suites)
bun test

# 5. Compile production Vite application bundle
bun run build

# 6. Run headless Playwright UI & 0-overflow inspection
node scripts/inspect-ui.cjs
```

*(npm commands like `npm run dev`, `npm test`, and `npm run build` remain fully compatible).*

---

## 9. Ready-Made Portfolio & Resume Bullets (Strictly Verified Facts)

### Resume Bullets (Technical & Quantified)
- **Engineered a full-stack AI document generation studio** (React 19, Bun 1.4, Vite 6, Tailwind v4, TypeScript) deployed on Vercel with free-tier OpenRouter LLM routing across 3 models (Nemotron 3 Ultra/Super, Gemma 4).
- **Architected a server-enforced security perimeter** (`/api/openrouter`, `/api/fetch-url`) implementing cryptographic Google ID token verification against Google public JWKS (RSA-SHA256) with OAuth access token fallback and sliding-window rate limiting.
- **Engineered robust SSRF defense mechanisms** for job-posting ingestion: DNS hostname resolution, IP blacklisting of loopback/private/metadata ranges (`169.254.169.254`), manual 3-hop redirect inspection, 8s timeout, and 2 MB streaming byte caps.
- **Hardened prompt-injection resilience and eliminated hallucinations** by wrapping untrusted inputs in XML delimiters, enforcing single-source-of-truth grounding rules, pinning temperature at 0.7, and providing an interactive 5-point post-generation factuality audit.
- **Implemented zero-leakage native Google authentication and privacy-conscious parsing**, replacing iframe OAuth with a custom 4-color SVG button and client-side PDF/DOCX extractors (`pdfjs-dist`, `mammoth` up to 10 pages) ensuring user files never touch external storage.
- **Built an automated Bun test suite (48 tests)** covering cryptographic auth, SSRF network filters, prompt assembly, and storage schema migrations, integrated into GitHub Actions CI.

### Portfolio Card Copy (~35 words)
> **CoverCraft — Grounded AI Document Pipeline**
> An editorial AI cover-letter studio that transforms PDF/DOCX resumes and job postings into tailored letters. Features server-verified Google authentication, SSRF-hardened URL reading, XML prompt isolation, and client-side parsing with zero file uploads.
> *Stack: React 19 · Bun · TypeScript · Tailwind v4 · OpenRouter · Vercel*
