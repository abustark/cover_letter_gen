# cover_letter_gen Commit Log

This document tracks every commit following the `2.0.x` versioning schema:

- Sequence: `2.0.1`, `2.0.2`, ..., `2.0.9`, `2.0.10` ➔ `2.1.0`, `2.1.1`, ..., `2.1.10` ➔ `2.2.0`, etc. The third number never exceeds `.10`.
- Format: `<version> - <short sentence>`
- **One version number per agent response / request batch** — not per issue, not per commit: a single owner request (even if it fixes many issues) consumes exactly ONE version number, multiple commits inside one response all take that same number (fold follow-up fixes into it — never burn a second number), and only a genuinely new owner request (a new response turn) advances the number.

> ### 📌 Next version — **keep this line current, every commit**
> - **`main` → `2.0.2`** (current head is `2.0.1` — see below)

---

## Commit History

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
