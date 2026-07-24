# Roadmap
Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

### 🔴 Bugs to Fix

- **Challenge Rating fields corrupt into date-serial numbers (e.g. `"1/4"` → `46026`) due to Google Sheets auto-parsing fractional strings as dates.** Confirmed live and 100% reproducible (found on a brand-new campaign with zero migration history, disproving an earlier `CHANGELOG.md` close-out that had misdiagnosed this as a stale, non-reproducible migration artifact — that entry needs a corrective follow-up once this ships). **Root cause**: `sheetsService.ts`'s write functions (`_updateSheetData`, `_appendSheetData`, `batchUpdateValues`) use `valueInputOption=USER_ENTERED`, which parses input exactly as the Sheets UI would — a fractional CR like `"1/4"`, `"1/2"`, or `"1/8"` gets silently reinterpreted as a calendar date (e.g. `"1/4"` → January 4) and stored as a date serial number. `fetchSheetData`'s `valueRenderOption=UNFORMATTED_VALUE` then reads back the raw serial number instead of the formatted string, which is why CSV/manual exports still show `"1/4"` (formatted display value) while the app shows `46026` (raw underlying value). **Fully scoped fix, ready to implement in 3 stages:**
  1. **New campaigns**: add a `repeatCell` request to `campaigns.ts`'s NPC-sheet provisioning, setting the `Challenge_Rating` column (Column Q, index 16) to Plain Text (`numberFormat: { type: 'TEXT' }`) — this stops Sheets from ever attempting date-detection on that column regardless of write mode. Confirmed this doesn't require hardcoded sheet IDs at creation to be unsafe: `getSheetIds()` (used by all 5 existing row-deletion call sites — `deleteCharacterRow`, `deleteEncounterCombatantDB`, `deleteEncounterDB`, `deleteNpcRow`, `deleteEncounterLogDB`) resolves sheet IDs dynamically off live metadata regardless of how those IDs were assigned, and a codebase scan confirmed there is exactly one campaign-creation path (`POST /api/campaigns/create`) with no cloning/duplication/import flow that would bypass this fix.
  2. **Existing campaigns** (including any campaign created before this fix, e.g. "New Test Campaign"): a new, explicitly user-triggered repair tool in `GMTestingTools.tsx` (the established home for maintenance/debug/repair actions — confirmed as the right location over `SheetConnectionSettings.tsx`, which is scoped narrowly to OAuth/spreadsheet-URL concerns). The tool (a) reformats the existing `Challenge_Rating` column to Plain Text, then (b) scans existing NPC rows for a numeric value in the date-serial range, (c) fetches the spreadsheet's real `locale` via `fetchSpreadsheetMetadata` to authoritatively determine MM/DD vs. DD/MM interpretation (falling back to presenting both interpretations for manual GM selection only if locale can't be determined — never guesses silently), and (d) requires **explicit GM confirmation per NPC** before writing any reconstructed value back. No automatic background repair/write-back under any circumstance.
  3. **Documentation**: a `CHANGELOG.md` correction entry, written only after Stages 1-2 ship, explicitly noting the earlier "stale artifact" diagnosis was wrong and why (the original fix — deleting and recreating the one affected NPC — likely just didn't happen to re-trigger the bug on retest; the real mechanism was never identified at the time).
  
  **Testing note, confirmed explicitly**: automated tests can only verify the outgoing `repeatCell` request is correctly shaped — the actual date-parsing behavior happens inside Google's server-side logic and can't be meaningfully mocked. A **one-time manual verification is required** before this can be considered actually fixed: type `"1/4"` into a Plain-Text-formatted Challenge Rating cell on a real spreadsheet and confirm it reads back correctly via the app, not just that the formatting request was sent.

- **`combatLogic.ts`'s `computeDamageWithIrv()` does not correctly handle a combatant with BOTH resistance AND vulnerability to the same damage type.** Discovered during the Round 2 modularity re-audit (see `CHANGELOG.md`). RAW 5e (2014) rules say both should apply (halve, then double — nets to the original amount). The code's sequential `if`/`else if` returns on the resistance match before vulnerability is ever checked, so an overlap is treated as merely resistant (half damage) instead of the correct full amount. Low-to-medium severity — standard stat blocks rarely have this overlap; matters mainly for homebrew content or a resistant PC hit by a vulnerability effect. No test currently covers this case. Fix: compute both matches; if both apply, net them out per RAW (return `baseDamage` with an appropriate combined label) — plus a new regression test.

- **`checkAndCaptureToken()` is called redundantly on every mount of any component using `useGoogleAuth`** (`App.tsx` calls it once on load; `initGoogleAuth()`, used by both `GMDashboard` and `CampaignSelector`, calls it again independently). Currently harmless only because the OAuth CSRF `state` check discards the second, stale attempt every time. Low priority: add a module-level "already processed this URL's code" flag so `initGoogleAuth()` skips re-attempting the exchange if already handled.

### 🟡 Features to Add / Test Coverage Gaps

- **New feature, fully scoped, ready for staged implementation — add "Bonus Actions" as a 4th top-level Stat Block category, and add markdown rendering across ALL 5 categories (Traits/Actions/Reactions/Legendary Actions/Bonus Actions) in the same effort.** Confirmed by direct inspection: description fields currently render via plain `DebouncedTextarea` (edit) and bare `{item.description}` JSX interpolation inside a `<p>` (`NpcStatBlockSection.tsx`, read-only) — no markdown parsing exists anywhere in this chain today (`**bold**`/`*italic*` display as literal characters). Fix: adopt `react-markdown`+`remark-gfm` in `NpcStatBlockSection.tsx`'s display path — this applies uniformly to all 5 categories via one shared change, since they all render through the same component.

  **Bonus Actions field shape, decided**: reuse the full `NpcAction` shape (attack bonus/damage/save DC/save type/range/recharge via `NpcCombatActionFields`), not the simpler name+description shape — justified by real 5e examples (bonus-action attacks, save-based bonus actions, recharge-gated bonus-action abilities all need the structured fields). Available on both `Character` and `NPC` entities, matching Traits/Actions/Reactions (unlike Legendary Actions, which stay NPC-only).

  **Schema impact, fully verified — no explicit migration needed for existing campaigns**: Characters sheet grows from 30 → 31 columns (new `Bonus_Actions` column at index 30, letter `AE`); NPCs sheet grows from 22 → 23 columns (new `Bonus_Actions` column at index 22, letter `W`). Confirmed safe on both the read side (`padRow()` pads short legacy rows with `undefined` before Zod validation; `stringDefault('[]')` converts that to a safe empty-array fallback at the specific field) and the write side (`updateNpcFullDB`/`updateCharacterDB` both construct a complete, hardcoded-length row array from the full current schema on every write, never reusing whatever length a row happened to be at read time — so any legacy row self-heals to the new length the first time it's saved). **Remember**: when implementing, the new `bonusActions ?? '[]'` entry must be explicitly added to the row-construction arrays in all 4 write functions (`addNpcDB`, `updateNpcFullDB`, and the `Character` equivalents) — easy to forget since adding the column to `NPC_HEADERS`/`CHARACTER_HEADERS`/the type definitions doesn't automatically add the corresponding array entry in these functions.

  **Consolidation, to be built as part of this feature, not deferred**: this would otherwise be the 5th near-duplicate `renderXFields`/`NpcListEditor` block across `CharacterCardExpanded.tsx`/`NewPlayerDialog.tsx`/`NpcCard.tsx`/`NpcStatBlockTab.tsx` (compounding the cross-file duplication already flagged below) — build the shared render-prop factory (e.g. `createNpcListRenderers(idPrefix)`) now, with Bonus Actions as the first category built through it, and migrate the existing 4 categories onto it in the same pass rather than duplicating a 5th time and cleaning up later.

  **Recommended implementation sequencing**: (1) schema first — types, `sheetSchemas.ts`, `campaigns.ts` provisioning, `combatantBuilder.ts`, all 4 write functions — verified in isolation via `tsc` + Batch 1 + Batch 2 before any UI work; (2) the shared render-prop factory consolidation; (3) Bonus Actions UI wiring across all 4 consumer files using the new factory; (4) markdown rendering in `NpcStatBlockSection.tsx`, applied to all 5 categories at once.

- **TODO — Stat Block should only render in the expanded Combatant Card, not the collapsed view; broader Expanded Combatant Card scan-ability redesign needed.** Confirmed via screenshot: the Stat Block (CR/Speed/Traits/etc.) is currently visible even when a combatant card is collapsed, which it shouldn't be — it's meant to be an expanded-only reference panel. Separately, and likely related, the GM has flagged that the *entire* expanded combatant card layout needs a broader pass to make it easier to scan at a glance during live play (this is a design/UX pass, not a bug fix — the same category of work as the earlier PC Combatant Card Header redesign). Not yet detailed — needs its own scoping conversation covering: which sections should collapse/expand independently, what the "scan at a glance" priority order should be (HP/AC first? conditions? resources?), and whether this reuses the collapsible-sections pattern already built for Traits/Actions/Reactions/Legendary Actions elsewhere in the app.

- **`CampaignSelector.tsx` has thin test coverage.** Existing `CampaignSelector.test.tsx` (4 tests) only covers static render states. Zero coverage for: expanding/submitting either form, validation-failure paths, or the inline delete-confirmation lifecycle. Worth a dedicated pass given this is the first screen every user sees. Follow the seam-test standard — assert on actual `onCreateCampaign`/`onConnectCampaign`/`onDeleteCampaign` call arguments.

- **`sheetsService.ts`'s `googleFetch` retry/backoff engine has zero dedicated test coverage.** No test exercises the 401→refresh→retry-once path, the 429/5xx exponential-backoff-with-jitter loop, or the `MAX_RETRIES` boundary. Given `googleAuth.ts` just turned up an undetected security regression specifically because a similar path had no test, this is worth prioritizing.

- **Tiny doc-precision fix, `dashboardStore.ts`'s `getSnapshot()` comment.** Harmless (confirmed zero live bugs), but the comment claims to "return only the AppState fields, not the store methods" while also silently excluding `activeCombatLog` (real state, not a method). Recommended: `// Return only the core Sheets-synchronized AppState-shaped fields. // Note: Extended state like activeCombatLog and store methods are excluded. // Call useDashboardStore.getState() directly if the combat log is needed.`

- **`ResourcePoolsSection.tsx`'s `PipTracker` doesn't respect `isSyncing`** the way the adjacent `-`/`+` buttons do (`disabled={... || isSyncing}`). Doesn't corrupt data, but is a real UX inconsistency — add `readOnly={isSyncing}` to the `PipTracker` call.

- **`ResourcePoolsSection.tsx` has no dedicated test file** — coverage is indirect only via `useCombatantExpanded.test.ts`'s integration tests; the UI layer itself (form toggles, inline edit, pip interactions) is untested.

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

### Candidate 2 — `src/lib/conditionDefinitions.ts` (766 lines) — genuine split warranted

498 lines (65%) of static `CONDITION_MECHANICS` data vs. 247 lines (32%) of real branching logic 
across `buildConditionSummary`/`applyLongRestToConditions`. Proposed: extract the data + interface 
into `src/lib/conditionMechanicsData.ts`; leave the 2 functions in a lean ~250-line 
`conditionDefinitions.ts`. **Not a zero-file-touch change**: `src/lib/concentrationCheck.ts` imports 
`CONDITION_MECHANICS` directly, bypassing the `conditions/index.ts` barrel — its import path must be 
updated, or `CONDITION_MECHANICS` re-exported from `conditionDefinitions.ts` for backward compat (a 
design choice to make explicitly before implementing). Every other consumer goes through the barrel 
and needs no changes. Verification requirement: raw `tsc` output + Batch 1 (both dedicated test files, 
24+5 tests) + every batch covering the 7 real downstream consumers.

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

### Candidate 4 — `src/components/ui/ConditionChips.tsx` (503 lines) — split warranted, test coverage must come first

Mixes floating-portal positioning/scroll/outside-click plumbing (~150 lines) + inline duration-prompt 
UI (~35 lines) with real D&D 5e rule automation (immunity blocking, exhaustion-6 death, concentration 
cascade) — the automation orchestration must stay in the coordinator. Proposed: extract 
`ConditionSearchDropdown.tsx` and `ConditionDurationPrompt.tsx` as pure presentational components — 
confirmed the dropdown does NOT need the parent's `wrapperRef` passed down; keep `open` state and 
scroll/outside-click listeners lifted in the parent, pass the dropdown only `isOpen`/`style`/results/
`onSelect`. **⚠️ Non-negotiable sequencing**: zero dedicated test coverage exists at all — this is the 
highest-stakes file in the whole audit (exhaustion-death, concentration-breaking automation). Tests 
must be added FIRST (debounced `onChange`, immunity-blocked rejection, exhaustion-tier replacement, 
exhaustion-6 death callback, incapacitation breaking concentration, manual "Concentrating" removal 
cascade, duration-timer confirm/skip), added to Batch 8, verified before any structural change.

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