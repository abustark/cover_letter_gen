# AGENTS.md — Agent Instructions

These rules are mandatory for any AI agent working in this repository.

## Execution Rules

1. **Implement first.** The AI's primary job is to perform updates, write code, fix bugs, and do exactly what the user asks. Do this first, without side quests or extra steps the user did not ask for.

2. **Run / test / gates only on explicit request.** Running new files, starting servers, testing updates, and checking gates (typecheck, lint, build, tests, screenshots) may only be executed when the user explicitly mentions or asks for them.

3. **Remind, don't run.** In its response, the AI may remind the user that running or testing the new updates is available. It must only actually run them after the user acknowledges or explicitly proceeds with it.

4. **Save images to the project folder.** Any screenshot, crop, capture, or other image produced while working on this project must also be saved to `D:\projects\cover_letter_gen\artifacts\` (in addition to the working temp folder on C:). Keep file names descriptive.

## Commit Naming & Versioning (strict)

1. Every commit follows this versioning structure: `2.0.1`, `2.0.2`, ..., `2.0.9`, `2.0.10` ➔ rolls over to `2.1.0`; then `2.1.1`, ..., `2.1.10` ➔ rolls over to `2.2.0`, etc. The third number NEVER exceeds `.10`.
2. Format: `<version> - <short description>` (e.g., `2.0.1 - fix pdf layout`). Keep it short and clear.
3. **One version number per agent response / request batch** — not per issue, not per commit. A single owner request (even if it fixes many issues) consumes exactly ONE version number. Multiple commits inside one response all take that same number (fold follow-up fixes into it — never burn a second number). Only a genuinely new owner request (a new response turn) advances the number.
4. Git history before this rule is unversioned; numbering starts at `2.0.0`. Every commit must also be logged in `COMMIT-HISTORY.md` (repo root) with its version and what it did, and the `📌 Next version` line at its top kept current.

## Order of Operations

1. Read the user's request.
2. Update files / write code / fix bugs as asked.
3. Optionally offer — in the response text — to run or test the changes.
4. Stop and wait for the user's acknowledgment before running anything.
