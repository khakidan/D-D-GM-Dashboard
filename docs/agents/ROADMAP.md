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

**Phase 3 starting point — real, evidenced `STYLE_GUIDE.md` violations, confirmed directly against real line numbers and class names.** The app's single mandated theme is "Minimalist Sleek" (`STYLE_GUIDE.md` explicitly forbids the old "warm parchment" palette by name and hex code), but that legacy palette is still actively in use in multiple places:
- `NewPlayerDialog.tsx`'s sub-tabs (`IdentityTab.tsx`, `CombatTab.tsx`): `border-stone-200`, `text-stone-800`, `focus:border-amber-400`/`focus:ring-amber-400` on inputs — should be the mandated `focus:border-[#2563eb]`.
- `App.tsx`: the "Authenticating..." loading screen still uses `bg-[#2c2c26]`, the old dark "Stone" charcoal.
- `ShortRestDialog.tsx`: `border-amber-200/50` — `STYLE_GUIDE.md` explicitly forbids any `bg-amber-`/`text-amber-*` usage.
- `CharacterCardExpanded.tsx`: `text-[#20201a]`, an old warm-palette near-black.
- `MultiTargetActionPanel.tsx`, `Badge.tsx`, `ResourcePoolManager.tsx`, `PipTracker.tsx`: residual amber variants.
- `Callout.tsx`: its `severity="warning"` variant uses `bg-amber-50 border-amber-200 text-amber-800`/`text-amber-500` internally — missed by the original audit, found later while reusing this shared component elsewhere. Worth prioritizing in this list given it's a shared component multiple other places already depend on for their own warning styling.

Not yet fixed — this needs a real, careful pass (confirm each instance directly against the file, not just this list, before changing anything) given the number of files involved.

**Other future audit categories, discussed but not yet started** — beyond bug-hunting, componentization, and the findings above, a professional React/TypeScript codebase review typically also covers:

- **Type safety** — a systematic sweep for `any`/unsafe type casts, missing null checks, and places where TypeScript's strictness is being worked around rather than honored.
- **Accessibility (a11y)** — semantic HTML, ARIA attributes, keyboard navigation, focus management.
- **Security** — this app handles real OAuth tokens and writes to a GM's actual Google Sheets. Worth checking `dangerouslySetInnerHTML` usage, how tokens are stored/read, and injection risk from user-generated content (NPC names, notes, etc.) rendered without sanitization.
- **Performance** — unnecessary re-renders, missing or excessive memoization, expensive computations re-running on every render unnecessarily.

Not yet scoped as concrete audit prompts — to be run the same way as the componentization audit (isolated, evidence-required categories) once prioritized.