# AGENTS.md — Agent Instructions

These rules are mandatory for any AI agent working in this repository.

## Execution Rules

1. **Implement first.** The AI's primary job is to perform updates, write code, fix bugs, and do exactly what the user asks. Do this first, without side quests or extra steps the user did not ask for.

2. **No gates / test runs without explicit proceed.** Never execute gate passes, test runs, typechecks, builds, or dev servers (`bun test`, `bun run typecheck`, `bun run build`, `inspect-ui`, etc.) without the user's explicit proceed command. Even if a prompt asks to verify or check, do not run test suites or gates unprompted.

3. **No automatic commit or push.** After completing code or file updates, do NOT commit or push automatically. Always ask the user in your response if they want to commit and push, and if they want to run test runs/gates. Wait for the user to explicitly tell you to proceed.

4. **Ask and remind, don't run or push.** In its response after any update, the AI must:
   - Summarize the file updates made.
   - Ask the user if they would like to commit and push the changes.
   - Remind the user that running test runs / gates is available.
   - Stop and wait for the user's explicit instructions before executing either.

5. **Save images to the project folder.** Any screenshot, crop, capture, or other image produced while working on this project must also be saved to `D:\projects\cover_letter_gen\artifacts\` (in addition to the working temp folder on C:). Keep file names descriptive.

## Commit Naming & Versioning (strict)

1. Every commit follows this versioning structure: `2.0.1`, `2.0.2`, ..., `2.0.9`, `2.0.10` ➔ rolls over to `2.1.0`; then `2.1.1`, ..., `2.1.10` ➔ rolls over to `2.2.0`, etc. The third number NEVER exceeds `.10`.
2. Format: `<version> - <short description>` (e.g., `2.1.2 - update agent rules for commit and gate permissions`). Keep it short and clear.
3. **One version number per agent response / request batch** — not per issue, not per commit. A single owner request (even if it fixes many issues) consumes exactly ONE version number. Multiple commits inside one response all take that same number (fold follow-up fixes into it — never burn a second number). Only a genuinely new owner request (a new response turn) advances the number.
4. Git history before this rule is unversioned; numbering starts at `2.0.0`. Every commit must also be logged in `COMMIT-HISTORY.md` (repo root) with its version and what it did, and the `📌 Next version` line at its top kept current.

## Order of Operations

1. Read the user's request.
2. Update files / write code / fix bugs as asked.
3. In the response, ask the user if they want to commit and push, and if they want to run tests/gates.
4. Stop and wait for the user's explicit proceed/acknowledgment before committing, pushing, or running tests.

## Architectural & Repository Invariants

1. **Self-contained Vercel serverless endpoints**:
   - Files in `api/` (`api/openrouter.ts`, `api/fetch-url.ts`) are deployed to Vercel serverless runtime and MUST remain 100% self-contained with zero relative imports from internal subdirectories within `api/`.
   - Never create or import from subdirectories like `api/utils/` or `api/_utils/`, as Vercel bundlers can strip or isolate them, causing runtime `FUNCTION_INVOCATION_FAILED` (HTTP 500).
   - Dedicated modules for offline unit testing under Bun test runner belong exclusively in `server/` (`server/auth.ts`, `server/prompts.ts`, `server/rateLimiter.ts`, `server/urlSecurity.ts`).

2. **Version metadata synchronization**:
   - Every version increment consumes one version number across the entire response turn.
   - Whenever bumping versions, all 4 version locations MUST be kept in sync:
     1. `App.tsx` footer version badge (`CoverCraft Studio v2.x.x`).
     2. `components/UpdateNotification.tsx` (`CURRENT_APP_VERSION = '2.x.x'`).
     3. `public/version.json` (`{ "version": "2.x.x" }`).
     4. `COMMIT-HISTORY.md` (top `📌 Next version` marker and new entry).

3. **Brand identity & favicon synchronization**:
   - The brand monogram badge in `components/Header.tsx` (obsidian squircle, warm amber border, Playfair Display dual-tone "CC" text) must stay strictly mirrored in `public/favicon.svg` and `favicon.svg`.
