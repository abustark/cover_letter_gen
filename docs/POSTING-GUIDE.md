# CoverCraft — Social & Portfolio Posting Guide (Reference for AI & Humans)

> **Purpose:** Reference guide for framing, showcasing, and launching CoverCraft across social platforms (LinkedIn, Twitter / X, GitHub, Portfolio). Future AI models and contributors should consult this document when drafting announcements, showcase posts, or resume/portfolio updates.

---

## 1. How to Frame Your Post (By Platform)

### 1.1 On LinkedIn (Focus on System Design & Security)

**Target Audience:** Engineering hiring managers, Applied AI developers, tech leads, and peers.

#### The Hook
> *"Most LLM wrappers leak API keys or suffer from SSRF vulnerabilities and hallucinated credentials. I built CoverCraft to show what a privacy-first, defensible AI document pipeline looks like."*

#### Key Talking Points
- **Rust WebAssembly Intelligence:** Sub-millisecond client-side ATS resume tokenizer (`crates/ats_engine`) and standalone typographic vector PDF layout engine (`crates/pdf_engine`) compiled to WASM with 100% in-browser privacy.
- **Native Systems SSRF Defense:** High-performance asynchronous Rust scraper (`crates/fetch_url`) with Tokio and Rustls enforcing DNS checks, RFC 1918 / cloud-metadata blacklisting, and byte-capped streaming.
- **Zero-Upload Privacy:** Client-side binary extraction (`pdfjs-dist`, `mammoth`) so candidate resumes never touch an external database.
- **Anti-Hallucination Guardrails:** XML prompt fences instructing the model to treat the resume as the sole source of truth, backed by an interactive 5-point factuality audit.
- **Modern Toolchain:** Built with React 19, Rust (WASM), Bun 1.4, Vite 6, Tailwind v4, 60 automated unit tests across 8 suites, and GitHub Actions CI.
- **Live Demo Link:** https://coverltr.vercel.app/

#### Ready-to-Publish LinkedIn Post Template
```text
Most LLM wrappers leak API keys or suffer from SSRF vulnerabilities and hallucinated credentials.

I built CoverCraft to show what a privacy-first, defensible AI document pipeline looks like.

Instead of another toy wrapper, CoverCraft is an editorial document studio designed with real security boundaries and native systems engineering:

🦀 Rust & WebAssembly Intelligence: Client-side ATS resume tokenizer (crates/ats_engine) and typographic vector PDF layout engine (crates/pdf_engine) compiled to WASM for sub-millisecond execution with zero data egress.
🛡️ Hardened SSRF Defense: When pasting job links, our scraper verifies DNS and enforces strict IP blacklists—blocking private networks, link-local addresses, and cloud metadata endpoints (169.254.169.254), mirrored in a native Tokio/Rustls systems engine (crates/fetch_url).
🔒 Zero-Upload Privacy: Candidate resumes (PDF/DOCX) are parsed entirely in-browser using pdfjs-dist and mammoth. Original documents never touch any server or cloud database.
🎯 Anti-Hallucination Prompts: Server-owned XML prompt boundaries enforce strict single-source-of-truth grounding against the candidate's actual credentials, backed by an interactive post-generation factuality audit.
⚡ Modern Toolchain: Powered by React 19, Rust WASM, Bun 1.4, Vite 6, and Tailwind v4, backed by 60 automated unit tests in Bun and GitHub Actions CI.
🎨 Editorial Aesthetics: High-prestige Playfair Display typography, custom CC monogram, and a tactile stationery interface—zero neon AI slop.

Live site: https://coverltr.vercel.app/
Source: https://github.com/abustark/cover_letter_gen

I’d love to hear your thoughts on the architecture and security approach!

#Rust #WebAssembly #React #TypeScript #Bun #SoftwareEngineering #AppliedAI #FullStack #SystemDesign
```

---

### 1.2 On Twitter / X (Visual Demo / Screen Recording)

**Format:** 20–30 second clean screen recording or high-resolution GIF.

#### Video Demo Shot List
1. **Intake (0:00–0:08):** Drag and drop a sample PDF resume into `Input 01`. Show the layout-aware extraction preserving section headers and bullet points.
2. **Configuration (0:08–0:14):** Toggle between Light and Dark mode (showing the concentric view transition wave). Pick a tone (e.g. *Confident* or *Creative*).
3. **Generation & Audit (0:14–0:22):** Click generate. Show the streaming synthesis, editorial stationery paper sheet, and interactive 5-point review checklist.
4. **Export (0:22–0:30):** Click export to download the formatted PDF or DOCX file with 1 click.

#### The Hook & Copy
> *"No neon AI slop — just high-end editorial typesetting and defensible security under the hood."*

#### Ready-to-Publish Tweet Template
```text
No neon AI slop — just high-end editorial typesetting and defensible systems engineering under the hood.

Built CoverCraft: a privacy-first AI cover letter studio featuring Rust WebAssembly ATS analysis & vector PDF layout, SSRF defense, client-side document parsing, and 60 automated tests in Bun.

Try it: https://coverltr.vercel.app/
Code: https://github.com/abustark/cover_letter_gen
```

---

### 1.3 On Your Portfolio (abufolio.vercel.app)

**Card Placement:** Lead project card under *Applied AI · Document Pipeline*.

#### Portfolio Card Block
```text
Title: CoverCraft — Grounded AI Document Pipeline
Subtitle: Full-Stack Web Application (React 19, Rust WASM, Bun 1.4, Vite 6, Tailwind v4, OpenRouter, Vercel)
Description: An editorial AI cover-letter studio that transforms PDF/DOCX resumes and job postings into tailored letters. Features client-side Rust WebAssembly ATS matching, vector PDF typesetting, server-verified Google authentication, SSRF-hardened URL reading, XML prompt isolation, and zero file uploads.
Tags: React 19 · Rust (WASM) · Bun · TypeScript · Tailwind v4 · OpenRouter · Vercel
Links: Live Demo (https://coverltr.vercel.app/) · GitHub (https://github.com/abustark/cover_letter_gen)
```

---

## 2. Key Differentiation Cheat Sheet for Future AI Assisting the Author

Whenever future AI agents or assistants draft social media copy, resume bullets, or interview talking points for CoverCraft, adhere to these rules:

1. **Lead with mechanism, not marketing buzzwords:**
   - *Say:* "Client-side binary AST extraction with layout-aware Y-coordinate tracking"
   - *Avoid:* "Magical seamless resume parsing"
2. **Highlight Rust Systems & WebAssembly Engineering:**
   - Sub-millisecond client-side resume keyword & metric density analysis compiled to WebAssembly (`crates/ats_engine`).
   - In-browser vector PDF typesetting with 0.75-inch letterpress margins compiled to WebAssembly (`crates/pdf_engine`).
   - High-performance asynchronous systems job scraper with Tokio & pure-Rust TLS (`crates/fetch_url`).
3. **Emphasize security invariants:**
   - Cryptographic RS256 JWKS token validation on the server.
   - Cloud metadata blocking (`169.254.169.254`) on job URL scraper.
   - Untrusted inputs fenced in `<candidate_resume>` and `<target_job_description>` XML tags.
4. **Highlight Bun + testing discipline:**
   - 60 unit tests running under native Bun (`bun test` across 8 suites).
   - GitHub Actions CI executing and passing on every push.
5. **Highlight bespoke brand identity:**
   - High-contrast Playfair Display serif "CC" monogram badge and synchronized vector favicon (`public/favicon.svg`).
