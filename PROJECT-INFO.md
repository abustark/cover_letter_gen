# CoverCraft — Project Info Sheet (Definitive Source of Truth)

> **Purpose:** Every architectural fact, security contract, design specification, and technical parameter an AI model (or developer) needs to completely understand CoverCraft without reading the underlying code. Generate all portfolio summaries, resume bullets, and technical assessments strictly from these facts; do not invent beyond them.

---

## 1. Project Identity & Status

| Field | Value |
|---|---|
| Name | **CoverCraft — AI Cover Letter Builder & Editorial Studio** |
| Current Version | **v2.2.3** (Production release, November 2026) |
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
| **Resume Extraction (PDF)**| pdfjs-dist | `^4.4.168` | Lazy-loaded client-side text extractor with layout-aware Y-coordinate tracking to preserve section breaks |
| **Resume Extraction (DOCX)**| mammoth | `^1.12.0` | Lazy-loaded client-side raw document text extractor |
| **Resume Structuring** | Custom cleaner | `services/resumeCleaner.ts` | Heuristic structuring engine (`cleanCrampedResumeText`) formatting headers, bullets, and contact info |
| **ATS & Keyword Matcher (Rust WASM)** | Rust & WebAssembly | `crates/ats_engine` | Client-side Rust WASM tokenizer & keyword gap analyzer with TS fallback (`services/atsEngine.ts`) |
| **Typographic PDF Engine (Rust WASM)** | Rust & WebAssembly | `crates/pdf_engine` | Standalone vector PDF layout & pagination engine compiled to WASM with jsPDF fallback (`services/pdfExportService.ts`) |
| **SSRF Web Scraper (Rust Native)** | Rust, Tokio & Rustls | `crates/fetch_url` | High-performance systems scraper with DNS verification, private IP blocking, streaming caps, and HTML stripping |
| **Export (DOCX)** | docx | `^9.7.1` | Lazy-loaded client-side Word document generator (Paragraph/TextRun AST) |
| **Rate Limiting** | Custom sliding-window | In-memory / Upstash Redis | Per-user `sub` and per-IP sliding-window quota management |
| **Testing Engine** | Bun Test | `bun test` (native) | 60 automated tests across 8 test suites (`test/*.test.ts`) |
| **E2E / Visual QA** | Playwright | CLI / headless | Headless browser assertions verifying 0 horizontal overflow on PC & mobile |
| **CI Automation** | GitHub Actions | `.github/workflows/ci.yml`| Automated workflow with `oven-sh/setup-bun@v2`, typecheck, test, and build |
| **Hosting (Production)** | Vercel Serverless | `@vercel/node ^5.5.13` | Edge/serverless deployment (`api/openrouter.ts`, `api/fetch-url.ts` 100% self-contained) |
| **Update Notification** | Custom polling toast | `components/UpdateNotification.tsx` | Background version polling (`/version.json`) with interactive "Refresh to Update" toast |
| **Typography & Monogram** | Google Fonts & SVG | Web CDN / inline SVG | `Playfair Display` (CC monogram & display), `Instrument Sans` (UI), `Source Serif 4` (letter) |

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
- **Executive Display:** `Playfair Display`, `serif`. Elegant, high-contrast serif applied to manuscript headings, hero brand accents, the logo monogram, and the footer portfolio link.
- **Technical Kickers & Badges:** `JetBrains Mono`, `SF Mono`, `Menlo`, `monospace`. High-density technical metadata tags.

### 3.4 Bespoke CC Serif Monogram & Favicon System
- **Brand Logo Badge (`components/Header.tsx`):**
  - Replaces generic iconography with an editorial monogram badge designed in `Playfair Display`.
  - Obsidian squircle base (`bg-stone-900 dark:bg-stone-950`) with an intentional amber accent hairline ring (`border-amber-500/35`).
  - Dual-tone typography: primary "C" rendered in warm alabaster (`text-stone-100 dark:text-stone-200`) and secondary "C" rendered in golden amber (`text-amber-500`).
- **Synchronized Vector Favicon (`public/favicon.svg` & `favicon.svg`):**
  - Vector SVG rendering the exact same dual-tone "CC" serif letterforms, amber accent ring, and obsidian squircle.
  - Ensures sharp, professional recognition across browser tabs and OS taskbars in both light and dark display modes.

---

## 4. Authentication, Navigation & Live Update Architecture

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

### 4.3 Proactive Live Update Notification Toast (`components/UpdateNotification.tsx`)
- Lightweight client component that polls `/version.json` periodically (every 2 minutes) and on browser `visibilitychange` / `window.focus`.
- Compares deployed version against bundle `CURRENT_APP_VERSION`.
- When a newer build is deployed on Vercel, smoothly renders a floating editorial toast with a "Refresh to Update" button and dismissible option, eliminating stale asset and caching issues without abrupt page reloads.

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

### 5.1 Dual-Mode Server Token Verification (`server/auth.ts` & inlined in `api/*.ts`)
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

### 5.2 SSRF Prevention & Safe URL Fetching (`server/urlSecurity.ts` & inlined in `api/fetch-url.ts`)
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

### 5.3 Server-Owned Prompt Architecture & Anti-Hallucination (`server/prompts.ts` & inlined in `api/openrouter.ts`)
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

### 5.4 Sliding-Window Rate Limiting (`server/rateLimiter.ts` & inlined in `api/*.ts`)
Protects upstream inference budgets and serverless compute from abuse:
- `/api/openrouter`: 15 requests per 10 minutes per verified user `sub`; 30 requests per 10 minutes per client IP.
- `/api/fetch-url`: 20 requests per 10 minutes per verified user `sub`; 40 requests per 10 minutes per client IP.
- Supports Upstash Redis / Vercel KV REST APIs for distributed state, with automatic in-memory fallback.

### 5.5 Document Privacy & Client-Side Extraction
- PDF parsing runs in-browser via `pdfjs-dist` (up to 10 pages). Password-protected and scanned image-only PDFs (<50 characters of selectable text) trigger informative alerts.
- DOCX parsing runs in-browser via `mammoth`.
- Uploaded candidate documents are **never** transmitted to or stored on any server. Only extracted plain text is sent to the generation proxy.

### 5.6 Layout-Aware PDF Extraction & Heuristic Structuring (`services/resumeCleaner.ts`)
- **Layout-Aware PDF Extraction (`components/InputSection.tsx`):**
  - Standard PDF.js `.join(' ')` strips all Y-coordinate geometry and flattens resumes into cramped single-paragraph blocks.
  - CoverCraft tracks bounding box Y coordinates and line heights across text tokens; when vertical coordinate shifts or `hasEOL` flags are detected, appropriate newlines and paragraph breaks are preserved.
- **Heuristic Section Structuring (`cleanCrampedResumeText`):**
  - Evaluates extracted text for standard resume headings (`EXPERIENCE`, `EDUCATION`, `SKILLS`, `SUMMARY`, `PROJECTS`, `CERTIFICATIONS`, etc.) and ensures they are preceded by double newlines.
  - Identifies inline bullet characters (`•`, `●`, `▪`, `–`, `*`) and forces them onto distinct lines.
  - Isolates email and phone contact details onto independent lines without corrupting addresses.
- **In-Place Auto-Format Action:**
  - The `Auto-Format` button directly formats existing textarea contents (using server-backed AI when authenticated, or client heuristic formatting when offline or unauthenticated) without requiring document re-upload.

### 5.7 Vercel Serverless Function Bundling Invariant
- Vercel's Node.js runtime builder (`@vercel/node`) treats top-level files in `api/*.ts` as serverless entry points and excludes or breaks subdirectories (e.g. `api/utils/` or `api/_utils/`), causing runtime `FUNCTION_INVOCATION_FAILED` (HTTP 500).
- `api/openrouter.ts` and `api/fetch-url.ts` are 100% self-contained single-file endpoints with zero relative internal imports.
- Modular utilities for local and CI automated testing are maintained separately in `server/` with strict TypeScript alignment.

### 5.8 Rust WebAssembly ATS Intelligence Engine (`crates/ats_engine` & `services/atsEngine.ts`)
- High-performance, memory-safe ATS resume tokenizer, keyword alignment engine, and metric density linter built in Rust and compiled to WebAssembly via `wasm-bindgen`.
- Operates 100% client-side in the browser, extracting matched technical keywords, identifying missing requirement gaps from the job posting, and detecting quantifiable metrics (`%`, `$`, scale multipliers) in sub-millisecond execution.
- Employs a dual-engine architecture in `services/atsEngine.ts` that dynamically loads the compiled `.wasm` binary when available and seamlessly falls back to an identical TypeScript AST engine, maintaining zero-cost operation and offline test runner stability.
- Features a responsive editorial UI card (`components/AtsScoreCard.tsx`) displaying real-time alignment scores, grade indicators, and interactive keyword chips.

### 5.9 Rust Typographic Editorial PDF Engine (`crates/pdf_engine` & `services/pdfExportService.ts`)
- Standalone vector PDF generation and typesetting engine written in Rust and compiled to WebAssembly.
- Implements publication-grade paragraph wrapping, optical letterpress margins (0.75-inch / 54 pt), automatic multi-page tree generation, and Times-Roman serif typography.
- Emits raw vector PDF 1.4 byte buffers directly in browser memory in <10 ms with zero external C dependencies.
- Supported via client-side dual-mode service in `services/pdfExportService.ts` with matching high-grade jsPDF fallback layout.

### 5.10 Rust High-Performance SSRF Scraper Engine (`crates/fetch_url`)
- Standalone native systems executable and reusable library engineered in Rust using `tokio` (multi-threaded asynchronous runtime), `reqwest` with pure-Rust `rustls-tls`, and zero C dependencies.
- Enforces strict network-level security: validates HTTPS scheme, port 443 constraints, hostname DNS resolution, and rejects IPv4/IPv6 private ranges, carrier-grade NAT, loopback, and cloud metadata endpoints (`169.254.169.254`).
- Implements manual redirect following up to 3 hops with re-verification at each hop, streaming byte caps (2 MB max download buffer), 8-second execution timeouts, and heuristic HTML text stripping producing ≤12,000 characters of clean posting text.
- Provides a fast, standalone binary with link-time optimization (LTO) and binary stripping (`opt-level = 3`, `strip = true`).

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
├── api/                           # Vercel Serverless Functions (100% Self-Contained)
│   ├── fetch-url.ts               # SSRF-safe URL scraper (inlined auth, SSRF & rate limit)
│   └── openrouter.ts              # OpenRouter AI proxy (inlined auth, rate limit & prompts)
├── components/                    # React UI Components
│   ├── AtsScoreCard.tsx           # Real-time ATS match & keyword gap intelligence card
│   ├── DraftsSection.tsx          # Local drafts repository with monogram tiles
│   ├── GoogleButton.tsx           # Custom native Google button (small & large, 4-color SVG)
│   ├── Header.tsx                 # Detached glass island navbar with CC monogram badge & avatar popover
│   ├── icons.tsx                  # Minimalist SVG icons (GoogleGIcon, UserIcon, etc.)
│   ├── InputSection.tsx           # Resume & JD inputs, layout-aware extraction, auto-format
│   ├── ModeSelector.tsx           # Synthesis engine model selector with status badges
│   ├── OutputSection.tsx          # Stationery manuscript, action island, 5-point audit
│   ├── UI.tsx                     # Reusable UI primitives (Segmented, Field, Button)
│   └── UpdateNotification.tsx     # Floating update toast with /version.json polling & refresh CTA
├── crates/                        # Native Rust Crates (WebAssembly & Systems Engines)
│   ├── ats_engine/                # Rust AST tokenizer, keyword gap & metric density engine
│   │   ├── Cargo.toml             # Rust package manifest (wasm-bindgen, serde)
│   │   ├── README.md              # WASM compilation & testing instructions
│   │   └── src/lib.rs             # Core Rust tokenizer & WebAssembly export functions
│   ├── fetch_url/                 # High-performance SSRF-hardened scraper engine
│   │   ├── Cargo.toml             # Rust package manifest (tokio, reqwest, rustls)
│   │   ├── README.md              # Systems security & SSRF defense documentation
│   │   └── src/
│   │       ├── lib.rs             # Core IP verification, redirect follower & text stripper
│   │       └── main.rs            # Native serverless/CLI executable entry point
│   └── pdf_engine/                # Typographic editorial PDF layout & vector rendering engine
│       ├── Cargo.toml             # Rust package manifest (wasm-bindgen, serde)
│       ├── README.md              # Vector PDF generation & pagination documentation
│       └── src/lib.rs             # Core PDF 1.4 vector builder & WebAssembly exports
├── docs/                          # Architecture & Portfolio Documentation
│   ├── assets/                    # Light & dark mode application previews
│   ├── bugs-and-fixes/            # Bug logging protocols and templates
│   ├── sandbox-browser/           # Playwright visual check kit & scripts
│   ├── PORTFOLIO-FRAMING.md       # High-conviction positioning copy for portfolio/resume
│   └── POSTING-GUIDE.md           # Platform posting hooks, Twitter demo scripts & launch copy
├── public/
│   ├── favicon.svg                # Vector dual-tone CC monogram browser tab favicon
│   └── version.json               # Deployed app version metadata for client polling
├── scripts/
│   └── inspect-ui.cjs             # Playwright automated E2E & 0-overflow inspection
├── server/                        # Dedicated Server & Testing Modules
│   ├── auth.ts                    # Dual-mode Google token verification (JWKS & tokeninfo)
│   ├── prompts.ts                 # Server-owned prompts, XML isolation, model allowlist
│   ├── rateLimiter.ts             # Sliding-window rate limiting (User & IP)
│   └── urlSecurity.ts             # SSRF prevention, DNS check, IP blacklist, HTML stripper
├── services/                      # Client Services
│   ├── atsEngine.ts               # ATS analysis dual-mode service (Rust WASM + TS fallback)
│   ├── auth.tsx                   # AuthContext, GoogleOAuthProvider, token lifecycle
│   ├── draftStorage.ts            # Local-first storage (v2 schema, quota recovery, migration)
│   ├── geminiService.ts           # Authenticated API client calling /api/* endpoints
│   ├── pdfExportService.ts        # Typographic editorial PDF export (Rust WASM + jsPDF fallback)
│   └── resumeCleaner.ts           # Heuristic structuring utility (cleanCrampedResumeText)
├── test/                          # Automated Bun Test Suite (60 tests across 8 suites)
│   ├── atsEngine.test.ts          # ATS keywords, scoring, and metrics detection tests
│   ├── auth.test.ts               # JWKS signature, expiry, audience, access token tests
│   ├── draftStorage.test.ts       # Storage v2 schema, migration, quota recovery tests
│   ├── fileValidation.test.ts     # PDF/DOCX file limits and scanned detection tests
│   ├── openrouter.test.ts         # Model routing, prompt injection, XML tags, rate tests
│   ├── pdfExportService.test.ts   # Editorial PDF generation & pagination tests
│   ├── resumeCleaner.test.ts      # Section breaks, bullet line breaks, contact info tests
│   └── urlSecurity.test.ts        # SSRF IP blacklists, DNS resolution, redirect tests
├── App.tsx                        # Root application component & theme management
├── bun.lock                       # Bun dependency lockfile
├── favicon.svg                    # Root vector favicon
├── index.css                      # Tailwind v4 theme, double-bezel, and stationery CSS
├── index.html                     # HTML entry point with Google Fonts preload
├── index.tsx                      # React root mount
├── package.json                   # Project manifest, scripts, and dependencies
├── tsconfig.json                  # Strict TypeScript configuration
├── vite.config.ts                 # Vite config with dev-server API proxy middleware
├── AGENTS.md                      # Mandatory AI agent operational rules & versioning
├── COMMIT-HISTORY.md              # Exhaustive chronological commit history & version log
├── PROJECT-INFO.md                # THIS FILE (Comprehensive source of truth)
└── README.md                      # Public GitHub documentation
```

---

## 8. Rust Systems & WebAssembly Engineering Suite (Deep Dive)

CoverCraft implements a multi-crate Rust workspace under `crates/` to deliver native systems performance, verifiable memory safety, and client-side privacy without external service overhead:

### 8.1 Engine 1 — WebAssembly ATS Intelligence Engine (`crates/ats_engine`)
- **Role:** High-speed client-side resume-to-job matching, keyword alignment, and metric density detection.
- **Tech Stack:** Rust 2021, `wasm-bindgen`, `serde`, `serde_json`, compiled to `.wasm` targeting WebAssembly.
- **Mechanism:** Tokenizes resumes and job descriptions using custom regex-free character classification, extracts multi-word technical compounds, calculates normalized keyword match densities, and scores quantifiable achievement metrics (`%`, `$`, multiplier patterns).
- **Performance & Privacy:** Executes in <1 ms inside the browser; zero candidate data leaves the user's device.
- **Architecture:** Dual-mode service in `services/atsEngine.ts` dynamically loads the compiled WASM binary with automatic zero-latency fallback to an identical TypeScript tokenizer for test runners and non-WASM environments.

### 8.2 Engine 2 — Native High-Performance SSRF Scraper (`crates/fetch_url`)
- **Role:** Hardened, isolated network engine for fetching and sanitizing remote job postings.
- **Tech Stack:** Rust 2021, `tokio` asynchronous runtime, `reqwest` with `rustls-tls` (no OpenSSL dependency), `url`, `regex`.
- **Mechanism:** Enforces HTTPS/port 443, resolves hostnames against DNS, validates IP addresses against CIDR blocklists (loopback, RFC 1918 private, link-local, cloud metadata `169.254.169.254`), follows bounded manual redirects (max 3), and enforces streaming byte limits (2 MB).
- **Stripping & Output:** Cleans messy web HTML into bounded plain-text job postings (≤12,000 chars) for prompt ingestion.
- **Distribution:** Standalone CLI executable and embeddable Rust crate.

### 8.3 Engine 3 — WebAssembly Typographic Vector PDF Engine (`crates/pdf_engine`)
- **Role:** Standalone client-side vector PDF document generator and editorial typesetter.
- **Tech Stack:** Rust 2021, `wasm-bindgen`, `serde`, custom PDF 1.4 low-level serializer.
- **Mechanism:** Builds pure vector PDF 1.4 objects directly in memory without heavy headless browsers or external C libraries. Calculates exact font metrics, handles optical letterpress margins (0.75 in / 54 pt), manages paragraph line wrapping, and handles dynamic multi-page pagination.
- **Performance:** Generates publication-ready PDFs in <10 ms in-browser, delivering crisp, searchable vector typography.
- **Architecture:** Seamlessly integrated via `services/pdfExportService.ts` with matching jsPDF fallback layout.

---

## 9. CLI & Developer Reference (Bun First & Cargo)

All development, testing, and compilation tasks run through **Bun** and **Cargo**:

```bash
# 1. Install frontend & test dependencies
bun install

# 2. Start local development server with API parity middleware (:3000)
bun run dev

# 3. Execute strict TypeScript typecheck (0 errors required)
bun run typecheck

# 4. Run automated test suite (60 tests across 8 test suites)
bun test

# 5. Compile production Vite application bundle
bun run build

# 6. Run headless Playwright UI & 0-overflow inspection
node scripts/inspect-ui.cjs

# 7. Build Rust Crates (Native Scraper & WASM Engines)
cd crates/fetch_url && cargo build --release
cd crates/ats_engine && wasm-pack build --target web --release
cd crates/pdf_engine && wasm-pack build --target web --release
```

*(npm commands like `npm run dev`, `npm test`, and `npm run build` remain fully compatible).*

---

## 10. Ready-Made Portfolio & Resume Bullets (Strictly Verified Facts)

### Resume Bullets (Technical & Quantified)
- **Engineered a full-stack AI document generation studio** (React 19, Bun 1.4, Vite 6, Tailwind v4, TypeScript) deployed on Vercel with free-tier OpenRouter LLM routing across 3 models (Nemotron 3 Ultra/Super, Gemma 4).
- **Architected a client-side WebAssembly (WASM) ATS keyword matching & metric density engine in Rust** (`crates/ats_engine`), analyzing resume credentials against job specifications in <1 ms with 100% in-browser privacy and zero cloud uploads.
- **Engineered an in-browser typographic vector PDF layout engine in Rust** (`crates/pdf_engine`), compiling to WebAssembly for publication-grade formatting, balanced 0.75-inch letterpress margins, and multi-page pagination.
- **Engineered a high-performance native Rust SSRF scraper engine** (`crates/fetch_url`) utilizing `tokio` and pure-Rust `rustls` to safely fetch remote job postings with DNS verification, RFC 1918 / cloud-metadata IP blocking, bounded 3-hop redirects, and 2 MB streaming byte caps.
- **Architected a server-enforced security perimeter** (`/api/openrouter`, `/api/fetch-url`) implementing cryptographic Google ID token verification against Google public JWKS (RSA-SHA256) with OAuth access token fallback and sliding-window rate limiting.
- **Hardened prompt-injection resilience and eliminated hallucinations** by wrapping untrusted inputs in XML delimiters, enforcing single-source-of-truth grounding rules, pinning temperature at 0.7, and providing an interactive 5-point post-generation factuality audit.
- **Designed layout-aware resume extraction and heuristic structuring** (`pdfjs-dist`, `mammoth`, `services/resumeCleaner.ts`) that tracks Y coordinates and preserves section headers, bullet points, and contact lines with 0 server uploads.
- **Engineered 100% self-contained serverless functions & real-time update notification toast**, eliminating Vercel bundler directory stripping (`FUNCTION_INVOCATION_FAILED`) and proactively alerting users to reload when new versions are deployed.
- **Built an automated Bun test suite (60 tests across 8 suites)** covering cryptographic auth, SSRF network filters, prompt assembly, heuristic parsing, ATS keyword alignment, PDF rendering, and storage schema migrations, integrated into GitHub Actions CI.

### Portfolio Card Copy (~35 words)
> **CoverCraft — Grounded AI Document Pipeline**
> An editorial AI cover-letter studio that transforms PDF/DOCX resumes and job postings into tailored letters. Features client-side Rust WebAssembly ATS matching, vector PDF typesetting, server-verified Google authentication, SSRF-hardened URL reading, XML prompt isolation, and zero file uploads.
> *Stack: React 19 · Rust (WASM) · Bun · TypeScript · Tailwind v4 · OpenRouter · Vercel*
