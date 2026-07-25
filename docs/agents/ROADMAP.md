# Roadmap
Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

### 🔴 Bugs to Fix

- **`checkAndCaptureToken()` is called redundantly on every mount of any component using `useGoogleAuth`** (`App.tsx` calls it once on load; `initGoogleAuth()`, used by both `GMDashboard` and `CampaignSelector`, calls it again independently). Currently harmless only because the OAuth CSRF `state` check discards the second, stale attempt every time. Low priority: add a module-level "already processed this URL's code" flag so `initGoogleAuth()` skips re-attempting the exchange if already handled.

### 🟡 Features to Add / Test Coverage Gaps

- **TODO — Stat Block should only render in the expanded Combatant Card, not the collapsed view; broader Expanded Combatant Card scan-ability redesign needed.** Confirmed via screenshot: the Stat Block (CR/Speed/Traits/etc.) is currently visible even when a combatant card is collapsed, which it shouldn't be — it's meant to be an expanded-only reference panel. Separately, and likely related, the GM has flagged that the *entire* expanded combatant card layout needs a broader pass to make it easier to scan at a glance during live play (this is a design/UX pass, not a bug fix — the same category of work as the earlier PC Combatant Card Header redesign). Not yet detailed — needs its own scoping conversation covering: which sections should collapse/expand independently, what the "scan at a glance" priority order should be (HP/AC first? conditions? resources?), and whether this reuses the collapsible-sections pattern already built for Traits/Actions/Reactions/Legendary Actions elsewhere in the app.

- **Tiny doc-precision fix, `dashboardStore.ts`'s `getSnapshot()` comment.** Harmless (confirmed zero live bugs), but the comment claims to "return only the AppState fields, not the store methods" while also silently excluding `activeCombatLog` (real state, not a method). Recommended: `// Return only the core Sheets-synchronized AppState-shaped fields. // Note: Extended state like activeCombatLog and store methods are excluded. // Call useDashboardStore.getState() directly if the combat log is needed.`

- **`NpcCard.tsx`'s Legendary Actions tests don't directly assert name-field editing** — only initial render, cost-editing, and add/remove are directly tested. Low priority; the underlying wiring was separately confirmed correct by direct code inspection.

---

## Refactor Candidates — Codebase Modularity Audit (Round 2)

The full audit (every file individually re-verified, including everything confirmed correctly-not-flagged) is documented in `CHANGELOG.md`. The 4 genuine candidates below are still open/unimplemented.

### Candidate 1 — `src/components/CommandPalette.tsx` (607 lines) — scope corrected, not yet decided whether worth doing

Original "command dispatch layer" premise didn't hold up (see `CHANGELOG.md`). Only 3 functions 
(`testDeathAnimation`/`testDamageAnimation`/`testHealAnimation`) are genuinely extractable; everything 
else is trivial inline dispatch next to its own menu item. The real problem is repetitive JSX 
markup (~25 near-identical `Command.Item` blocks), not tangled logic. A markup-deduplication refactor 
(a small render-helper or data-driven `.map()`) would be a different, smaller-scoped fix than 
originally proposed — not yet decided if it's worth doing given the modest real payoff either way.

### Candidate 3 — `src/components/AudioLibrary.tsx` (546 lines) — split warranted, test coverage must come first

5 genuine responsibility clusters (upload/drag-drop, playback preview, mood-assignment popover, 
cascading delete/localStorage sync, tab-switching). Proposed split into `MoodAssignmentPopover.tsx`, 
`AudioFileRow.tsx` (does NOT own preview state — `previewingFileId`/`previewAudioRef`/
`previewTimerRef` must stay lifted in the parent for the single-preview-at-a-time guarantee), and 
`AudioLibraryDropzone.tsx`. Extracting `AudioFileRow.tsx` does NOT automatically prevent re-renders — 
that requires a separate `React.memo` + `useCallback` step. **⚠️ Non-negotiable sequencing**: 
`AudioLibrary.test.tsx` has only 2 tests; coverage (successful upload, delete-confirmation lifecycle, 
single-preview enforcement) must be substantially expanded FIRST, verified via Batch 7B-1, before any 
structural extraction begins.

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