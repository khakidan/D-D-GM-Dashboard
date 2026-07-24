# Testing Structure — 13-Batch System

Referenced from the root [AGENTS.md](../../AGENTS.md) (Rule 9: report all 13 batch counts individually after any change — never report only a combined total).

This file is maintained with the same discipline as [ROADMAP.md](ROADMAP.md)/[CHANGELOG.md](CHANGELOG.md)/[file-reference.md](file-reference.md) — kept current every session, not left stale. It was split out of `AGENTS.md` specifically because it's frequently-changing data (updated almost every session as tests are added), unlike `AGENTS.md`'s otherwise-stable rules and conventions, and unlike [testing-philosophy.md](testing-philosophy.md)'s stable quality principles. Update the table and baseline below immediately whenever a test count changes.

**Current baseline: 901 tests.** Real, verified totals for every affected batch, run individually per this file's own rule:

- **Batch 4: 11 tests.** Breakdown: campaigns.test.ts (5), auth.test.ts (3), suiteIntegrity.test.ts (2), health.test.ts (1).
- **Batch 5A: 69 → 65.** useCombatantCard.test.ts was removed from this batch's file list because useCombatantCard.ts (the hook it tested) was deleted in a prior refactor.

Run each batch individually. Never chain with `&&`. Never use glob patterns. Never run all tests at once with `npx vitest run`.

| Batch | Description | Test Count |
|-------|-------------|------------|
| 1 | `src/lib/__tests__` | 479 |
| 2 | `src/services/__tests__` | 42 |
| 3 | `src/hooks/__tests__` | 62 |
| 4 | `src/server/__tests__` + `src/__tests__` | 11 |
| 5A | ActiveEncounterTab hooks (`.test.ts`) | 65 |
| 5B | ActiveEncounterTab components (`.test.tsx`) | 50 |
| 6A | `src/components/PartyTab/__tests__` | 60 |
| 6B | `src/components/EncountersTab/__tests__` | 26 |
| 6C | `src/components/NpcLibraryTab/__tests__` | 24 |
| 7B-1 | Audio + main dashboard top-level components | 13 |
| 7B-2 | Other top-level components | 23 |
| 8 | `src/components/ui/__tests__` | 30 |
| 9 | `src/components/auth/__tests__` | 16 |

```bash
# BATCH 1 — 479 tests
npx vitest run src/lib/__tests__

# BATCH 2 — 42 tests
npx vitest run src/services/__tests__

# BATCH 3 — 62 tests
npx vitest run src/hooks/__tests__

# BATCH 4 — 11 tests
npx vitest run src/server/__tests__ src/__tests__

# BATCH 5A — 65 tests
npx vitest run src/components/ActiveEncounterTab/__tests__/useBatchActions.test.ts src/components/ActiveEncounterTab/__tests__/useCombatSync.test.ts src/components/ActiveEncounterTab/__tests__/useCombatantExpanded.test.ts src/components/ActiveEncounterTab/__tests__/useEncounterPresetLoader.test.ts src/components/ActiveEncounterTab/__tests__/useHealthChange.test.ts src/components/ActiveEncounterTab/__tests__/useSelectionMode.test.ts src/components/ActiveEncounterTab/__tests__/useCombatantMutations.test.ts

# BATCH 5B — 50 tests
npx vitest run src/components/ActiveEncounterTab/__tests__/AddNpcCollision.test.tsx src/components/ActiveEncounterTab/__tests__/CasterAttributionDialog.test.tsx src/components/ActiveEncounterTab/__tests__/CombatHeader.test.tsx src/components/ActiveEncounterTab/__tests__/AddCombatantDialog.test.tsx src/components/ActiveEncounterTab/__tests__/CombatantCard.test.tsx src/components/ActiveEncounterTab/__tests__/KeyboardShortcuts.test.tsx src/components/ActiveEncounterTab/__tests__/MultiTargetActionPanel.test.tsx src/components/ActiveEncounterTab/__tests__/NpcReferencePanel.test.tsx src/components/ActiveEncounterTab/__tests__/PcReferencePanel.test.tsx src/components/ActiveEncounterTab/__tests__/ShortcutCheatSheet.test.tsx src/components/ActiveEncounterTab/__tests__/combatStarted.test.tsx src/components/ActiveEncounterTab/__tests__/index.test.tsx src/components/ActiveEncounterTab/__tests__/useCinematicVideo.test.tsx src/components/ActiveEncounterTab/__tests__/RechargeToastContent.test.tsx

# BATCH 6A — 60 tests
npx vitest run src/components/PartyTab/__tests__

# BATCH 6B — 26 tests
npx vitest run src/components/EncountersTab/__tests__

# BATCH 6C — 24 tests
npx vitest run src/components/NpcLibraryTab/__tests__

# BATCH 7B-1 — 13 tests
npx vitest run src/components/__tests__/CommandPalette.test.tsx src/components/__tests__/ErrorBoundary.test.tsx src/components/__tests__/GMDashboard.test.tsx src/components/__tests__/GMDashboardSidebar.test.tsx src/components/__tests__/AudioLibrary.test.tsx

# BATCH 7B-2 — 23 tests
npx vitest run src/components/__tests__/CampaignSelector.test.tsx src/components/__tests__/GMTabContent.test.tsx src/components/__tests__/PlayerView.test.tsx src/components/__tests__/ThemeContext.test.tsx src/components/__tests__/GMTestingTools.test.tsx src/components/__tests__/SheetConnectionSettings.test.tsx src/components/__tests__/ReferenceDataSeeder.test.tsx src/components/__tests__/SettingsPage.test.tsx

# BATCH 8 — 30 tests
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