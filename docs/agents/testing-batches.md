# Testing Structure — 13-Batch System
Referenced from the root [AGENTS.md](../../AGENTS.md) (Rule 9: report all 13 batch counts individually after any change — never report only a combined total).
This file is maintained with the same discipline as [ROADMAP.md](ROADMAP.md)/[CHANGELOG.md](CHANGELOG.md)/[file-reference.md](file-reference.md) — kept current every session, not left stale. It was split out of `AGENTS.md` specifically because it's frequently-changing data (updated almost every session as tests are added), unlike `AGENTS.md`'s otherwise-stable rules and conventions, and unlike [testing-philosophy.md](testing-philosophy.md)'s stable quality principles. Update the table and baseline below immediately whenever a test count changes.

**Current baseline: 991 tests.** Real, verified totals for every affected batch, run individually per this file's own rule:
- **Batch 1: 488 → 499.** Breakdown: 488 (baseline) + 3 (sheetSyncParser.test.ts null/undefined row handling ×2, combatantBuilder.test.ts GM-controlled character mapping ×1) + 1 (untracked pre-existing test in combatLogic.test.ts, cause unconfirmed) + 7 (additional tests for dndUtils and other lib functionality) = 499.
- **Batch 2: 56 → 57.** Breakdown: 56 (established baseline, already includes earlier bonusActions round-trip coverage for characters.test.ts/npcs.test.ts) + 1 (redundant-processing regression test for checkAndCaptureToken in googleAuth.test.ts) = 57.
- **Batch 3: 62 tests.** Not touched this session — re-confirmed via fresh individual run, unchanged.
- **Batch 4: 11 tests.** Breakdown: campaigns.test.ts (5, including the Bonus_Actions column-count correction), auth.test.ts (3), suiteIntegrity.test.ts (2), health.test.ts (1).
- **Batch 5A: 65 tests.** Breakdown: useBatchActions (11), useCombatSync (30), useCombatantExpanded (3), useEncounterPresetLoader (5), useHealthChange (8), useSelectionMode (3), useCombatantMutations (5) = 65.
- **Batch 5B: 54 → 56.** Breakdown: 54 (baseline) + 2 (PC resource pools and NPC exclusion verification tests) = 56.
- **Batch 6A: 60 tests.** Not touched this session — re-confirmed via fresh individual run, unchanged.
- **Batch 6B: 26 tests.** Not touched this session — re-confirmed via fresh individual run, unchanged.
- **Batch 6C: 26 tests.** Breakdown: 26 passed across 6 test files in src/components/NpcLibraryTab/__tests__.
- **Batch 7B-1: 18 → 21.** Breakdown: 18 (baseline) + 3 (new mock DOM scroll listener, visibility toggle, and scrollTo top tests for ScrollToTop) = 21.
- **Batch 7B-2: 23 → 31.** Breakdown: 23 (baseline) + 8 (CampaignSelector interactions/validation/delete-lifecycle tests, plus 1 other unrecorded test confirmed via fresh run) = 31.
- **Batch 8: 60 → 61.** Breakdown: 60 (established baseline) + 1 (new test confirming the Remove button is hidden when collapsed and functional once expanded) = 61.
- **Batch 9: 16.** Not touched this session.

Run each batch individually. Never chain with `&&`. Never use glob patterns. Never run all tests at once with `npx vitest run`.

| Batch | Description | Test Count |
|-------|-------------|------------|
| 1 | `src/lib/__tests__` | 499 |
| 2 | `src/services/__tests__` | 57 |
| 3 | `src/hooks/__tests__` | 62 |
| 4 | `src/server/__tests__` + `src/__tests__` | 11 |
| 5A | ActiveEncounterTab hooks (`.test.ts`) | 65 |
| 5B | ActiveEncounterTab components (`.test.tsx`) | 56 |
| 6A | `src/components/PartyTab/__tests__` | 60 |
| 6B | `src/components/EncountersTab/__tests__` | 26 |
| 6C | `src/components/NpcLibraryTab/__tests__` | 26 |
| 7B-1 | Audio + main dashboard top-level components | 21 |
| 7B-2 | Other top-level components | 31 |
| 8 | `src/components/ui/__tests__` | 61 |
| 9 | `src/components/auth/__tests__` | 16 |

```bash
# BATCH 1 — 499 tests
npx vitest run src/lib/__tests__
# BATCH 2 — 57 tests
npx vitest run src/services/__tests__
# BATCH 3 — 62 tests
npx vitest run src/hooks/__tests__
# BATCH 4 — 11 tests
npx vitest run src/server/__tests__ src/__tests__
# BATCH 5A — 65 tests
npx vitest run src/components/ActiveEncounterTab/__tests__/useBatchActions.test.ts src/components/ActiveEncounterTab/__tests__/useCombatSync.test.ts src/components/ActiveEncounterTab/__tests__/useCombatantExpanded.test.ts src/components/ActiveEncounterTab/__tests__/useEncounterPresetLoader.test.ts src/components/ActiveEncounterTab/__tests__/useHealthChange.test.ts src/components/ActiveEncounterTab/__tests__/useSelectionMode.test.ts src/components/ActiveEncounterTab/__tests__/useCombatantMutations.test.ts
# BATCH 5B — 56 tests
npx vitest run src/components/ActiveEncounterTab/__tests__/AddNpcCollision.test.tsx src/components/ActiveEncounterTab/__tests__/CasterAttributionDialog.test.tsx src/components/ActiveEncounterTab/__tests__/CombatHeader.test.tsx src/components/ActiveEncounterTab/__tests__/AddCombatantDialog.test.tsx src/components/ActiveEncounterTab/__tests__/CombatantCard.test.tsx src/components/ActiveEncounterTab/__tests__/KeyboardShortcuts.test.tsx src/components/ActiveEncounterTab/__tests__/MultiTargetActionPanel.test.tsx src/components/ActiveEncounterTab/__tests__/ShortcutCheatSheet.test.tsx src/components/ActiveEncounterTab/__tests__/combatStarted.test.tsx src/components/ActiveEncounterTab/__tests__/index.test.tsx src/components/ActiveEncounterTab/__tests__/useCinematicVideo.test.tsx src/components/ActiveEncounterTab/__tests__/RechargeToastContent.test.tsx
# BATCH 6A — 60 tests
npx vitest run src/components/PartyTab/__tests__
# BATCH 6B — 26 tests
npx vitest run src/components/EncountersTab/__tests__
# BATCH 6C — 26 tests
npx vitest run src/components/NpcLibraryTab/__tests__
# BATCH 7B-1 — 21 tests
npx vitest run src/components/__tests__/CommandPalette.test.tsx src/components/__tests__/ErrorBoundary.test.tsx src/components/__tests__/GMDashboard.test.tsx src/components/__tests__/GMDashboardSidebar.test.tsx src/components/__tests__/AudioLibrary.test.tsx src/components/__tests__/ScrollToTop.test.tsx
# BATCH 7B-2 — 31 tests
npx vitest run src/components/__tests__/CampaignSelector.test.tsx src/components/__tests__/GMTabContent.test.tsx src/components/__tests__/PlayerView.test.tsx src/components/__tests__/ThemeContext.test.tsx src/components/__tests__/GMTestingTools.test.tsx src/components/__tests__/SheetConnectionSettings.test.tsx src/components/__tests__/ReferenceDataSeeder.test.tsx src/components/__tests__/SettingsPage.test.tsx
# BATCH 8 — 61 tests
npx vitest run src/components/ui/__tests__
# BATCH 9 — 16 tests
npx vitest run src/components/auth/__tests__
```

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