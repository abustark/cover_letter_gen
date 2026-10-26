# cover_letter_gen Commit Log

This document tracks every commit following the `2.0.x` versioning schema:

- Sequence: `2.0.1`, `2.0.2`, ..., `2.0.9`, `2.0.10` ➔ `2.1.0`, `2.1.1`, ..., `2.1.10` ➔ `2.2.0`, etc. The third number never exceeds `.10`.
- Format: `<version> - <short sentence>`
- **One version number per agent response / request batch** — not per issue, not per commit: a single owner request (even if it fixes many issues) consumes exactly ONE version number, multiple commits inside one response all take that same number (fold follow-up fixes into it — never burn a second number), and only a genuinely new owner request (a new response turn) advances the number.

> ### 📌 Next version — **keep this line current, every commit**
> - **`main` → `2.0.4`** (current head is `2.0.3` — see below)

---

## Commit History

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
