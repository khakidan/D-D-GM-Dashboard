# Roadmap

Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

Features and bugs that have been discussed and approved but not yet implemented. Each entry contains enough context to implement without further discussion.

### 🔴 Bugs to Fix

None currently open.

### 🟡 Features to Add

**Full Codebase Audit (bugs → componentization → UI uniformity).** Comprehensive pass for logic errors/bugs, oversized files needing decomposition, and UI/UX uniformity closer to established D&D apps (D&D Beyond, Roll20 conventions). Phase 3 (UI uniformity) has a concrete starting point now (see below) but has not yet been worked.

**Phase 3 remainder — 2 files left from the original `STYLE_GUIDE.md` violations audit.** All 8 originally-identified files/instances (`NewPlayerDialog.tsx`'s sub-tabs, `App.tsx`, `ShortRestDialog.tsx`, `CharacterCardExpanded.tsx`, `MultiTargetActionPanel.tsx`, `Badge.tsx`, `ResourcePoolManager.tsx`, `PipTracker.tsx`, `Callout.tsx`) have been fixed — see `CHANGELOG.md`. 2 files surfaced during the later theme-compliance audit remain:
- `GMTestingTools.tsx`: `border-amber-300`/`hover:bg-amber-100` on the "Test Initiative Animation" button — should be the mandated `border-[#2563eb]`.
- `ReferenceDataSeeder.tsx`: `text-stone-400` — should be the mandated neutral slate equivalent.

Not yet fixed — confirm each instance directly against the real file before changing anything, given a prior implementation attempt for this audit went badly out of scope and had to be fully reverted.

**Other future audit categories, discussed but not yet started** — beyond bug-hunting, componentization, and the findings above, a professional React/TypeScript codebase review typically also covers:

- **Type safety** — a systematic sweep for `any`/unsafe type casts, missing null checks, and places where TypeScript's strictness is being worked around rather than honored.
- **Accessibility (a11y)** — semantic HTML, ARIA attributes, keyboard navigation, focus management.
- **Security** — this app handles real OAuth tokens and writes to a GM's actual Google Sheets. Worth checking `dangerouslySetInnerHTML` usage, how tokens are stored/read, and injection risk from user-generated content (NPC names, notes, etc.) rendered without sanitization.
- **Performance** — unnecessary re-renders, missing or excessive memoization, expensive computations re-running on every render unnecessarily.

Not yet scoped as concrete audit prompts — to be run the same way as the componentization audit (isolated, evidence-required categories) once prioritized.