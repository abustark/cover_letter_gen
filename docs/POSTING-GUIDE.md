# CoverCraft — Social & Portfolio Posting Guide (Reference for AI & Humans)

> **Purpose:** Reference guide for framing, showcasing, and launching CoverCraft across social platforms (LinkedIn, Twitter / X, GitHub, Portfolio). Future AI models and contributors should consult this document when drafting announcements, showcase posts, or resume/portfolio updates.

---

## 1. How to Frame Your Post (By Platform)

### 1.1 On LinkedIn (Focus on System Design & Security)

**Target Audience:** Engineering hiring managers, Applied AI developers, tech leads, and peers.

#### The Hook
> *"Most LLM wrappers leak API keys or suffer from SSRF vulnerabilities and hallucinated credentials. I built CoverCraft to show what a privacy-first, defensible AI document pipeline looks like."*

#### Key Talking Points
- **Zero-Upload Privacy:** Client-side binary extraction (`pdfjs-dist`, `mammoth`) so candidate resumes never touch an external database.
- **SSRF Mitigation:** A dedicated scraper blocking internal networks, link-local IPs, and AWS/GCP cloud metadata endpoints (`169.254.169.254`).
- **Anti-Hallucination Guardrails:** XML prompt fences instructing the model to treat the resume as the sole source of truth, backed by an interactive 5-point factuality audit.
- **Modern Toolchain:** Built with React 19, Bun 1.4, Vite 6, Tailwind v4, 53 automated unit tests, and GitHub Actions CI.
- **Live Demo Link:** https://coverltr.vercel.app/

#### Ready-to-Publish LinkedIn Post Template
```text
Most LLM wrappers leak API keys or suffer from SSRF vulnerabilities and hallucinated credentials.

I built CoverCraft to show what a privacy-first, defensible AI document pipeline looks like.

Instead of another toy wrapper, CoverCraft is an editorial document studio designed with real security boundaries:

🔒 Zero-Upload Privacy: Candidate resumes (PDF/DOCX) are parsed entirely in-browser using pdfjs-dist and mammoth. Original documents never touch any server or cloud database.
🛡️ Hardened SSRF Defense: When pasting job links, a serverless scraper verifies DNS and enforces strict IP blacklists—blocking private networks, link-local addresses, and cloud metadata endpoints (169.254.169.254) with bounded redirects.
🎯 Anti-Hallucination Prompts: Server-owned XML prompt boundaries enforce strict single-source-of-truth grounding against the candidate's actual credentials, backed by an interactive post-generation factuality audit.
⚡ Modern Toolchain: Powered by React 19, Bun 1.4, Vite 6, and Tailwind v4, backed by 53 automated unit tests in Bun and GitHub Actions CI.
🎨 Editorial Aesthetics: High-prestige Playfair Display typography, custom CC monogram, and a tactile stationery interface—zero neon AI slop.

Live site: https://coverltr.vercel.app/
Source: https://github.com/abustark/cover_letter_gen

I’d love to hear your thoughts on the architecture and security approach!

#WebDevelopment #React #TypeScript #Bun #SoftwareEngineering #AppliedAI #FullStack #SystemDesign
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
No neon AI slop — just high-end editorial typesetting and defensible security under the hood.

Built CoverCraft: a privacy-first AI cover letter studio with server-verified Google auth, SSRF defense, client-side PDF parsing (zero server uploads), and 53 automated tests in Bun.

Try it: https://coverltr.vercel.app/
Code: https://github.com/abustark/cover_letter_gen
```

---

### 1.3 On Your Portfolio (abufolio.vercel.app)

**Card Placement:** Lead project card under *Applied AI · Document Pipeline*.

#### Portfolio Card Block
```text
Title: CoverCraft — Grounded AI Document Pipeline
Subtitle: Full-Stack Web Application (React 19, Bun 1.4, Vite 6, Tailwind v4, OpenRouter, Vercel)
Description: An editorial AI cover-letter studio that transforms PDF/DOCX resumes and job postings into tailored letters. Features server-verified Google authentication, SSRF-hardened URL reading, XML prompt isolation, and client-side parsing with zero file uploads.
Tags: React 19 · Bun · TypeScript · Tailwind v4 · OpenRouter · Vercel
Links: Live Demo (https://coverltr.vercel.app/) · GitHub (https://github.com/abustark/cover_letter_gen)
```

---

## 2. Key Differentiation Cheat Sheet for Future AI Assisting the Author

Whenever future AI agents or assistants draft social media copy, resume bullets, or interview talking points for CoverCraft, adhere to these rules:

1. **Lead with mechanism, not marketing buzzwords:**
   - *Say:* "Client-side binary AST extraction with layout-aware Y-coordinate tracking"
   - *Avoid:* "Magical seamless resume parsing"
2. **Emphasize security invariants:**
   - Cryptographic RS256 JWKS token validation on the server.
   - Cloud metadata blocking (`169.254.169.254`) on job URL scraper.
   - Untrusted inputs fenced in `<candidate_resume>` and `<target_job_description>` XML tags.
3. **Highlight Bun + testing discipline:**
   - 53 unit tests running under native Bun (`bun test`).
   - GitHub Actions CI executing on every push.
4. **Highlight bespoke brand identity:**
   - High-contrast Playfair Display serif "CC" monogram badge and synchronized vector favicon (`public/favicon.svg`).
