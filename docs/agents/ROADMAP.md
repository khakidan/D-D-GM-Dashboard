# Roadmap
Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

### 🔴 Bugs to Fix

- **`checkAndCaptureToken()` is called redundantly on every mount of any component using `useGoogleAuth`** (`App.tsx` calls it once on load; `initGoogleAuth()`, used by both `GMDashboard` and `CampaignSelector`, calls it again independently). Currently harmless only because the OAuth CSRF `state` check discards the second, stale attempt every time. Low priority: add a module-level "already processed this URL's code" flag so `initGoogleAuth()` skips re-attempting the exchange if already handled.

### 🟡 Features to Add / Test Coverage Gaps

- **New feature, fully scoped, ready for staged implementation — add "Bonus Actions" as a 4th top-level Stat Block category, and add markdown rendering across ALL 5 categories (Traits/Actions/Reactions/Legendary Actions/Bonus Actions) in the same effort.** Confirmed by direct inspection: description fields currently render via plain `DebouncedTextarea` (edit) and bare `{item.description}` JSX interpolation inside a `<p>` (`NpcStatBlockSection.tsx`, read-only) — no markdown parsing exists anywhere in this chain today (`**bold**`/`*italic*` display as literal characters). Fix: adopt `react-markdown`+`remark-gfm` in `NpcStatBlockSection.tsx`'s display path — this applies uniformly to all 5 categories via one shared change, since they all render through the same component.
  **Bonus Actions field shape, decided**: reuse the full `NpcAction` shape (attack bonus/damage/save DC/save type/range/recharge via `NpcCombatActionFields`), not the simpler name+description shape — justified by real 5e examples (bonus-action attacks, save-based bonus actions, recharge-gated bonus-action abilities all need the structured fields). Available on both `Character` and `NPC` entities, matching Traits/Actions/Reactions (unlike Legendary Actions, which stay NPC-only).
  **Schema impact, fully verified — no explicit migration needed for existing campaigns**: Characters sheet grows from 30 → 31 columns (new `Bonus_Actions` column at index 30, letter `AE`); NPCs sheet grows from 22 → 23 columns (new `Bonus_Actions` column at index 22, letter `W`). Confirmed safe on both the read side (`padRow()` pads short legacy rows with `undefined` before Zod validation; `stringDefault('[]')` converts that to a safe empty-array fallback at the specific field) and the write side (`updateNpcFullDB`/`updateCharacterDB` both construct a complete, hardcoded-length row array from the full current schema on every write, never reusing whatever length a row happened to be at read time — so any legacy row self-heals to the new length the first time it's saved). **Remember**: when implementing, the new `bonusActions ?? '[]'` entry must be explicitly added to the row-construction arrays in all 4 write functions (`addNpcDB`, `updateNpcFullDB`, and the `Character` equivalents) — easy to forget since adding the column to `NPC_HEADERS`/`CHARACTER_HEADERS`/the type definitions doesn't automatically add the corresponding array entry in these functions.
  **Consolidation, to be built as part of this feature, not deferred**: this would otherwise be the 5th near-duplicate `renderXFields`/`NpcListEditor` block across `CharacterCardExpanded.tsx`/`NewPlayerDialog.tsx`/`NpcCard.tsx`/`NpcStatBlockTab.tsx` (compounding the cross-file duplication already flagged below) — build the shared render-prop factory (e.g. `createNpcListRenderers(idPrefix)`) now, with Bonus Actions as the first category built through it, and migrate the existing 4 categories onto it in the same pass rather than duplicating a 5th time and cleaning up later.
  **Recommended implementation sequencing**: (1) schema first — types, `sheetSchemas.ts`, `campaigns.ts` provisioning, `combatantBuilder.ts`, all 4 write functions — verified in isolation via `tsc` + Batch 1 + Batch 2 before any UI work; (2) the shared render-prop factory consolidation; (3) Bonus Actions UI wiring across all 4 consumer files using the new factory; (4) markdown rendering in `NpcStatBlockSection.tsx`, applied to all 5 categories at once.

- **TODO — Stat Block should only render in the expanded Combatant Card, not the collapsed view; broader Expanded Combatant Card scan-ability redesign needed.** Confirmed via screenshot: the Stat Block (CR/Speed/Traits/etc.) is currently visible even when a combatant card is collapsed, which it shouldn't be — it's meant to be an expanded-only reference panel. Separately, and likely related, the GM has flagged that the *entire* expanded combatant card layout needs a broader pass to make it easier to scan at a glance during live play (this is a design/UX pass, not a bug fix — the same category of work as the earlier PC Combatant Card Header redesign). Not yet detailed — needs its own scoping conversation covering: which sections should collapse/expand independently, what the "scan at a glance" priority order should be (HP/AC first? conditions? resources?), and whether this reuses the collapsible-sections pattern already built for Traits/Actions/Reactions/Legendary Actions elsewhere in the app.

- **Tiny doc-precision fix, `dashboardStore.ts`'s `getSnapshot()` comment.** Harmless (confirmed zero live bugs), but the comment claims to "return only the AppState fields, not the store methods" while also silently excluding `activeCombatLog` (real state, not a method). Recommended: `// Return only the core Sheets-synchronized AppState-shaped fields. // Note: Extended state like activeCombatLog and store methods are excluded. // Call useDashboardStore.getState() directly if the combat log is needed.`

- **Cross-file Traits/Actions/Reactions/Legendary-Actions render-prop wiring is duplicated across `CharacterCardExpanded.tsx`, `NewPlayerDialog.tsx`, and `NpcCard.tsx`.** `renderTraitFields`/`renderReactionFields` are byte-identical across all 3; `renderActionFields`/`renderLegendaryActionFields` differ only by a per-file `idPrefix` string. Mirrors the exact situation that led to this codebase's `NpcSimpleFieldEditor.tsx`/`NpcCombatActionFields.tsx` extraction. **This is being addressed as part of the Bonus Actions feature above**, rather than as a separate effort — the shared factory will be built there and all 4 files (including `NpcStatBlockTab.tsx`) migrated onto it in the same pass.

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