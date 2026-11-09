# CoverCraft — Portfolio Framing (for abufolio.vercel.app)

> **Scope:** messaging only. The card/UI change lives in the abufolio repo.
> Every claim below is traceable to `PROJECT-INFO.md`; nothing here is invented.
> Audience: hiring managers for **Data & Analytics Engineer**, **Applied AI**,
> and adjacent backend roles — not a design/dev-tool audience.

---

## 1. The core shift

The site sells engineering rigor and quantified outcomes. A card that opens with
"AI-powered cover letter builder" reads as a wrapper around someone else's model.
The same project reads as an **AI document pipeline** when the mechanism leads.

| | Current card | Reframed |
|---|---|---|
| Lead | "An AI-powered cover letter builder engineered with React, TypeScript, and OpenRouter AI." | What enters and leaves the system |
| Middle | Feature list (OAuth, URL fetch, "context alignment") | The two hard constraints: CORS and secret isolation |
| Close | — | The routing matrix: 4 modes × 4 tones × 3 models, temperature pinned |

**Rule:** category → mechanism. Say *what the system does to the data*, not what
market category it belongs to. "AI-powered" is a label; "extracts, strips, routes"
is evidence.

---

## 2. Reading order (four beats, in this sequence)

1. **Input** — two unstructured documents: a PDF/DOCX resume and a job posting (text or URL).
2. **Mechanism** — parse client-side → fetch and strip posting server-side → constrain the prompt → route to a model.
3. **Hardest constraint** — the API key can never reach the browser, and browsers cannot fetch LinkedIn. Both are solved by the same architectural move: two serverless functions.
4. **What it proves** — pipeline thinking, API boundaries, cost control at zero inference spend, and the discipline to know what the app does *not* protect.

Do not spend a sentence on UI polish until the mechanism is on the page.

---

## 3. Feature → mechanism translation

| Product feature | Say this instead |
|---|---|
| Cover letter generator | document-to-letter pipeline |
| Upload resume | client-side PDF/DOCX text extraction (`pdfjs-dist`, `mammoth`), lazy-loaded |
| Paste job URL | server-side fetch + HTML strip capped at 12,000 chars, defeating browser CORS |
| 4 modes / 4 tones | routing matrix — 16 prompt profiles, each mode mapped to one of three free models |
| API key is safe | key boundary — dev-only bundle injection, production key lives only in the Vercel function env |
| Drafts | local-first persistence — UUID keys, ISO timestamps, no database |
| Export to PDF/DOCX | client-side document generation, heavy libs dynamically imported |
| Google sign-in | server-verified OAuth boundary (RS256 JWKS signature + access token fallback), custom native button (no Gmail ID leakage) |
| Dark mode / responsiveness | **omit from the card.** It is table stakes, not a differentiator |

---

## 4. Paste-ready card block (abufolio)

Matches the existing card schema — eyebrow, title, body, tags, links.

```
eyebrow: Applied AI · Document Pipeline · Nov 2025 – Oct 2026
title:   CoverCraft — Resume-to-Cover-Letter Pipeline
body:    Turns two unstructured documents — a PDF/DOCX resume and a job posting —
         into a tailored letter. Parsing runs client-side; the posting is fetched
         and stripped server-side to escape browser CORS; a second Vercel function
         proxies three OpenRouter free models so the key never reaches the bundle.
         Four modes × four tones, temperature pinned at 0.7.
tags:    React 19 · TypeScript · Bun · Vercel Functions · OpenRouter · Google OAuth
links:   Live site (coverltr.vercel.app) · GitHub repo
```

**Short variant** (~28 words, for filtered/mobile views):

> Document-to-letter pipeline: client-side PDF/DOCX parsing, server-side posting
> fetch to beat CORS, and a serverless OpenRouter proxy that keeps zero secrets in
> the bundle.

**Do not** mark it "Private" — the GitHub repo is public (`private: false`).

---

## 5. Resume bullets (3, dense)

- Built a document-to-letter pipeline (React 19, TypeScript, Vercel Functions) that parses PDF/DOCX resumes and job-posting URLs, then routes the combined context through **4 modes × 4 tones = 16 prompt profiles**, mapping each mode to one of three OpenRouter free models at a pinned temperature of 0.7.
- Kept the LLM key out of the production bundle by proxying OpenRouter through a serverless function, and moved posting retrieval server-side (HTML stripped, capped at 12,000 chars) to defeat browser CORS on LinkedIn-style pages.
- Kept the initial bundle lean by dynamically importing `pdfjs-dist`, `mammoth`, `jsPDF` and `docx` on first use; persisted drafts, theme and session locally with UUID keys and server-verified Google tokens (RS256 JWKS) instead of adding a database.

---

## 6. Role-fit map (honest)

| Target role | Strength of this project | How to use it |
|---|---|---|
| Applied AI Developer | **Strong** — model routing, prompt contracts, key isolation | Lead card position; this is its best fit |
| Data & Analytics Engineer | **Medium** — extraction and cleaning pipeline, not analytics | Pair with the case notes so the pipeline work is visible |
| Data Analyst | Weak | Do not force it; the other four cards carry this |
| Database / SQL Developer | None | Do not claim schema or query work — there is no database |

Showing that you know which project supports which role is itself a signal.

---

## 7. Language rules

**Use:** pipeline, extraction, routing, boundary, constraint, proxy, server-side,
client-side, pinned, validated, stripped, cryptographic JWKS, SSRF defense.

**Ban:** AI-powered (as the lead), seamless, powerful, cutting-edge, leverage,
effortless, revolutionary, beautiful.

**Never claim** (these do not exist in the architecture): database, cloud draft sync,
user counts, conversion metrics. (Note: Automated test suite, server-side JWKS auth,
and rate limiting are fully implemented and verified).

**Match the site's register:** past tense, verb first, one mechanism per sentence,
at most one number per sentence, no adjectives standing in for evidence.

---

## 8. Social & Launch Posting Guide

For comprehensive LinkedIn hooks, Twitter / X video scripts, copy templates, and ready-to-post snippets across platforms, refer directly to [`docs/POSTING-GUIDE.md`](POSTING-GUIDE.md).
