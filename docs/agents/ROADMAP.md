# Roadmap

Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

### 🔴 Bugs to Fix

None.

### 🟡 Features to Add / Test Coverage Gaps

None.

## Post-Reorganization Professionalism Improvements (Pending)

Following the src/components/ reorganization and final sanity-check pass, concrete follow-up improvements were identified and scoped. Production bundle optimization (originally item 1 of this list) is complete — see `CHANGELOG.md`. Remaining items below. Do as isolated, dedicated passes — one at a time, each independently verified — not bundled together or combined with feature work.

### 1. Production error tracking (Sentry)
Add `@sentry/react` (client) and `@sentry/node` (server) for basic unexpected-error visibility — currently there is no signal when something breaks for a user outside of a live debugging session. Scope narrowly to genuine unexpected errors (React crashes via `ErrorBoundary.tsx`, unhandled promise rejections, Express route errors) — explicitly do NOT instrument the app's existing expected-failure paths (DB-write rollback/retry logic), which already have correct user-facing handling via Sonner toasts and would just create alert noise. Requires manually creating a Sentry account/project and setting real `VITE_SENTRY_DSN`/`SENTRY_DSN` values — that step needs dashboard access, not something achievable in-session. See prior session notes for a fully scoped implementation plan (investigation → install → wire into `ErrorBoundary.tsx` → global unhandled-rejection listener → full 13-batch + build verification).

### 2. CI/CD pipeline
No automated pipeline currently runs the test suite on push/PR — all 1060 tests across 13 batches have only ever been run manually in-session. Add a GitHub Actions workflow (or equivalent, confirm real hosting/repo setup first) that runs `tsc --noEmit` plus all 13 batches on every push, and blocks merges on failure. Should respect the project's "never chain batches with `&&`, never run all tests with a bare `vitest run`" rule structurally in the workflow, not just as a written convention.

**Note:** These are incremental hardening work on an already-functioning app — none are blocking or urgent. Sequence and pace are Dan's call.

---

## Working Discipline — Lessons Baked Into This Project (read before starting any new work)

1. **Never accept a "tests passed" or "verified" claim without literal, pasted, raw terminal output.**
2. **Never expand scope beyond what was explicitly requested in the current step.**
3. **Any "verbatim" or "raw" quote of a file must be independently checked against the real file before being trusted.** The `NpcCard.tsx` investigation (see `CHANGELOG.md`) is a live example: a suspected prop-mismatch bug turned out to be a transcription artifact from an earlier paste, caught only by re-verifying against the real file.
4. **Investigate before proposing a fix — especially for anything touching shared state, rollback logic, or cross-component data flow.** The same principle applies to refactor *candidates*: an initial "this file is cohesive" judgment isn't trustworthy until independently re-verified line-by-line (see the Round 2 audit in `CHANGELOG.md`).
5. **When a redesign or consolidation has already happened to a file, check `CHANGELOG.md` for it before touching that file again.**
6. **When a refactor candidate's investigation reveals thin or nonexistent test coverage, treat expanding that coverage as a mandatory prerequisite stage, not an optional nice-to-have.**
7. **A file being reviewed for one reason doesn't mean it should only be checked for that reason.** The `googleAuth.ts` and `combatLogic.ts` bugs above were both found only because a file was being read closely enough to verify a structural claim — watch for correctness issues too, always.
8. **A "no explicit migration needed" claim for a schema change must be verified on BOTH the read side and the write side before being trusted** — the Bonus Actions scoping above is the model: `padRow()`/`stringDefault()` were confirmed to handle short legacy rows on read, and the row-construction functions were separately confirmed to always emit full-length rows on write, rather than assuming one side's safety implies the other's.