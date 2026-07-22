# Testing Structure — 12-Batch System

Referenced from the root [AGENTS.md](../../AGENTS.md) (Rule 9: report all 12 batch counts individually after any change — never report only a combined total).

This file is maintained with the same discipline as [ROADMAP.md](ROADMAP.md)/[CHANGELOG.md](CHANGELOG.md)/[file-reference.md](file-reference.md) — kept current every session, not left stale. It was split out of `AGENTS.md` specifically because it's frequently-changing data (updated almost every session as tests are added), unlike `AGENTS.md`'s otherwise-stable rules and conventions, and unlike [testing-philosophy.md](testing-philosophy.md)'s stable quality principles. Update the table and baseline below immediately whenever a test count changes.

**Current baseline: 897 tests.** Updated after the "GM-Controlled PC Stat Block" feature (adding `gmControlled`/`traits`/`actions`/`reactions` to `Character`, threading them through the schema/adapter/builder/DB-write layers, new UI in `CharacterCardExpanded.tsx`/`NewPlayerDialog.tsx`/a new `PcReferencePanel.tsx`, and a real pre-existing bug fix in `campaigns.ts`'s seeding-range calculation) — see `CHANGELOG.md`. Real, verified totals for every affected batch, run individually per this file's own rule:

- **Batch 1: 474 → 479.** `sheetSchemas.test.ts` gained 2 tests (boundary-case coverage for `gmControlled`'s `TRUE`/`FALSE`/missing transform and `traits`/`actions`/`reactions` defaults), `sheetAdapters.test.ts` gained 1 (a seam test on `mapCharacterRowToCharacter()`'s handling of the 4 new fields), `combatantBuilder.test.ts` gained 2 (one per PC-construction code path in `buildCombatantsFromState()`, confirming `gmControlled`/`traits`/`actions`/`reactions` thread through correctly).
- **Batch 2: 41 → 42.** `characters.test.ts` gained 1 new seam test asserting the real row data written to `appendSheetData`/`queueWriteResolved` includes correct non-default values for the 4 new fields at their correct trailing indices.
- **Batch 4: 9 → 10.** `campaigns.test.ts` gained 1 new test verifying the campaign-seeding range-computation fix is genuinely dynamic per-sheet (Characters ends at `AD`, NPCs independently ends at `V`, in the same test) — not hardcoded to the new Characters width as a second coincidence, which is exactly the class of bug this same test-writing effort found and fixed in `campaigns.ts` itself.
- **Batch 5B: 42 → 50 (12 → 14 files).** New file `PcReferencePanel.test.tsx` (3 tests) added — a PC-specific analog to `NpcReferencePanel.test.tsx`, deliberately verified to omit all NPC-only content (CR/Speed/Senses/Languages/Legendary Actions) even when those fields are present on the underlying `Combatant` object. `CombatantCard.test.tsx` gained 3 tests verifying `PcReferencePanel` renders only when `pcCharacter?.gmControlled` is true, never for NPCs. Separately, `RechargeToastContent.test.tsx` (2 tests, pre-existing, previously passing) was found to be missing from this batch's documented command entirely — a pre-existing gap unrelated to this feature, closed while updating this batch's file list for the other additions.
- **Batch 6A: 57 → 60.** `usePartyCharacterCrud.test.ts` gained 1 test (the whitelist DB-write seam test — confirms `gmControlled`/`traits`/`actions`/`reactions` updates actually reach `updateCharacterDB`, the specific failure mode a missed whitelist entry produces silently). `CharacterCardExpanded.test.tsx` gained 1 (the GM-Controlled toggle reveals/hides the three stat-block editors and correctly calls `onUpdate`). `NewPlayerDialog.test.tsx` gained 1 (the new "Stat Block" tab is reachable, and submitting the form includes the entered `gmControlled`/`traits`/`actions`/`reactions` values in the complete object passed to `onConfirm`).

Prior baseline reconciliation history:

Run each batch individually. Never chain with `&&`. Never use glob patterns. Never run all tests at once with `npx vitest run`.

| Batch | Description | Test Count |
|-------|-------------|------------|
| 1 | `src/lib/__tests__` | 479 |
| 2 | `src/services/__tests__` | 42 |
| 3 | `src/hooks/__tests__` | 62 |
| 4 | `src/server/__tests__` + `src/__tests__` | 10 |
| 5A | ActiveEncounterTab hooks (`.test.ts`) | 69 |
| 5B | ActiveEncounterTab components (`.test.tsx`) | 50 |
| 6A | `src/components/PartyTab/__tests__` | 60 |
| 6B | `src/components/EncountersTab/__tests__` | 26 |
| 6C | `src/components/NpcLibraryTab/__tests__` | 21 |
| 7B-1 | Audio + main dashboard top-level components | 13 |
| 7B-2 | Other top-level components | 23 |
| 8 | `src/components/ui/__tests__` | 27 |
| 9 | `src/components/auth/__tests__` | 16 |

```bash
# BATCH 1 — 479 tests
npx vitest run src/lib/__tests__

# BATCH 2 — 42 tests
npx vitest run src/services/__tests__

# BATCH 3 — 62 tests
npx vitest run src/hooks/__tests__

# BATCH 4 — 10 tests
npx vitest run src/server/__tests__ src/__tests__

# BATCH 5A — 69 tests
npx vitest run src/components/ActiveEncounterTab/__tests__/useBatchActions.test.ts src/components/ActiveEncounterTab/__tests__/useCombatSync.test.ts src/components/ActiveEncounterTab/__tests__/useCombatantCard.test.ts src/components/ActiveEncounterTab/__tests__/useCombatantExpanded.test.ts src/components/ActiveEncounterTab/__tests__/useEncounterPresetLoader.test.ts src/components/ActiveEncounterTab/__tests__/useHealthChange.test.ts src/components/ActiveEncounterTab/__tests__/useSelectionMode.test.ts src/components/ActiveEncounterTab/__tests__/useCombatantMutations.test.ts

# BATCH 5B — 50 tests
npx vitest run src/components/ActiveEncounterTab/__tests__/AddNpcCollision.test.tsx src/components/ActiveEncounterTab/__tests__/CasterAttributionDialog.test.tsx src/components/ActiveEncounterTab/__tests__/CombatHeader.test.tsx src/components/ActiveEncounterTab/__tests__/AddCombatantDialog.test.tsx src/components/ActiveEncounterTab/__tests__/CombatantCard.test.tsx src/components/ActiveEncounterTab/__tests__/KeyboardShortcuts.test.tsx src/components/ActiveEncounterTab/__tests__/MultiTargetActionPanel.test.tsx src/components/ActiveEncounterTab/__tests__/NpcReferencePanel.test.tsx src/components/ActiveEncounterTab/__tests__/PcReferencePanel.test.tsx src/components/ActiveEncounterTab/__tests__/ShortcutCheatSheet.test.tsx src/components/ActiveEncounterTab/__tests__/combatStarted.test.tsx src/components/ActiveEncounterTab/__tests__/index.test.tsx src/components/ActiveEncounterTab/__tests__/useCinematicVideo.test.tsx src/components/ActiveEncounterTab/__tests__/RechargeToastContent.test.tsx

# BATCH 6A — 60 tests
npx vitest run src/components/PartyTab/__tests__

# BATCH 6B — 26 tests
npx vitest run src/components/EncountersTab/__tests__

# BATCH 6C — 21 tests
npx vitest run src/components/NpcLibraryTab/__tests__

# BATCH 7B-1 — 13 tests
npx vitest run src/components/__tests__/CommandPalette.test.tsx src/components/__tests__/ErrorBoundary.test.tsx src/components/__tests__/GMDashboard.test.tsx src/components/__tests__/GMDashboardSidebar.test.tsx src/components/__tests__/AudioLibrary.test.tsx

# BATCH 7B-2 — 23 tests
npx vitest run src/components/__tests__/CampaignSelector.test.tsx src/components/__tests__/GMTabContent.test.tsx src/components/__tests__/PlayerView.test.tsx src/components/__tests__/ThemeContext.test.tsx src/components/__tests__/GMTestingTools.test.tsx src/components/__tests__/SheetConnectionSettings.test.tsx src/components/__tests__/ReferenceDataSeeder.test.tsx src/components/__tests__/SettingsPage.test.tsx

# BATCH 8 — 27 tests
npx vitest run src/components/ui/__tests__

# BATCH 9 — 16 tests
npx vitest run src/components/auth/__tests__
```

*Note: `EncounterLogModal.test.tsx` (5 tests) and `useEncounterLogs.test.ts` (4 tests) are part of Batch 6B.*

*Note: Batch 3 corrected from 41 → 44 tests (discovered during the useDeathSaves.ts stabilization-counter fix). This was pre-existing staleness — 3 tests were added to `src/hooks/__tests__` in an untracked prior session and never reflected here. No source of the discrepancy beyond "not this session's change" could be confirmed (no git history available in the working copy).*

*Note: Batch 1 corrected from 449 → 450 tests (discovered while adding the `DEFAULT_STATUSES` constant to `lib/constants.ts`). Same pattern as the Batch 2 and Batch 3 corrections above — a standalone, test-file-untouched change that shouldn't have moved the count at all, run against a real, raw, independently-summed terminal output (19 files summing to exactly 450, verified by hand) rather than accepted from a bare claim. The root cause is the same as those two: pre-existing staleness from an untracked prior session, not traceable (no git history available in the working copy).*

*Note: Batch 2 corrected from 34 → 33 tests (discovered during the Badge System Audit's Phase 1-4 verification). `npcs.test.ts` was independently confirmed (direct file inspection) to hold exactly 10 tests. A prior AI Studio claim that it "was documented as 11" is not supported by anything in this file — no per-file counts have ever been recorded here, only batch totals — and was not accepted as fact. The real cause of the batch-total drop from 34 to 33 could not be traced (no git history available); nothing in the Badge Audit's actual file changes (`irvOptions.ts`, `conditionDefinitions.ts`, `resourcePools.ts`, `CombatantCardBadges.tsx`, `CombatantCardHeader.tsx`) touches `src/services/`.*

*Note: Batch 6A corrected from 46 → 51 tests in one update, covering two separate missed updates from the bug-fix queue. The Jack of All Trades multiclass fix added 2 tests to `LevelUpDialog.test.tsx` (17→19) that were verified at the time but never reflected here (46→48 was missed). The short-rest HP cap fix immediately after added 3 more to `usePartyRest.test.ts` (15→18, 48→51), and that's when the earlier miss was caught and both corrected together. This was Claude's own tracking gap, not a data-integrity issue with the tests themselves — both sets of new tests were independently verified against the actual production math before being accepted.*

*Note: Batch 2's count of 41 (previously 40) reflects the addition of `encounterCombatants.test.ts` — a dedicated regression test for the `Encounter_Combatants_ID` race-condition fix (see `CHANGELOG.md`).*

*Note: Batch 3 corrected from 61 → 62 tests, and the original `useEncounterResume.test.ts` "restores in-progress encounter state..." test was split into two — one confirming the sheet's `activeTurnId` correctly carries through when it matches a real rebuilt combatant, one confirming the existing fallback-to-first-combatant behavior when it doesn't — after discovering the original single test's mock data never actually matched the real rebuilt ID format (`combat-pc-char-1`) and had been silently exercising only the fallback path the whole time.*

*Note: Batch 5B's file list was corrected to include `RechargeToastContent.test.tsx` (2 tests), which had been a pre-existing, undocumented gap in this batch's command — unrelated to any specific feature, just discovered and closed while updating this batch's list for the GM-Controlled PC Stat Block feature.*

## Where new test files go

| New test covers | Add to batch |
|-----------------|--------------|
| `src/lib/` | Batch 1 (auto-picked up) |
| `src/services/` | Batch 2 (auto-picked up) |
| `src/hooks/` | Batch 3 (auto-picked up) |
| AET hook (`.test.ts`) | Add to Batch 5A explicitly |
| AET component (`.test.tsx`) | Add to Batch 5B explicitly |
| PartyTab | Batch 6A (auto-picked up) |
| EncountersTab | Batch 6B (auto-picked up) |
| NpcLibraryTab | Batch 6C (auto-picked up) |
| Audio or main dashboard | Add to Batch 7B-1 explicitly |
| Other top-level component | Add to Batch 7B-2 explicitly |
| `src/components/ui/` | Batch 8 (auto-picked up) |
| `src/components/auth/` | Batch 9 (auto-picked up) |