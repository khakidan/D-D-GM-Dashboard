# Roadmap
Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

Features and bugs that have been discussed and approved but not yet implemented. Each entry contains enough context to implement without further discussion.

### 🔴 Bugs to Fix

- **`checkAndCaptureToken()` is called redundantly on every mount of any component using `useGoogleAuth`** (confirmed: `App.tsx` calls it once on load; `initGoogleAuth()` — invoked by `useGoogleAuth`, used by both `GMDashboard` and `CampaignSelector` — calls it again independently). Currently harmless only because the OAuth CSRF `state` check (added earlier this session) happens to catch and discard the second, stale attempt every time — but this means the app is relying on that guard to paper over an avoidable duplicate call, not actually preventing the duplicate at its source. Low priority: worth adding a guard (e.g. a module-level "already processed this URL's code" flag) so `initGoogleAuth()` skips re-attempting the exchange if it's already been handled, rather than depending on the CSRF check to quietly absorb the redundant call every time.

### 🟡 Features to Add

None right now.

---

## Refactor Candidates — Codebase Modularity Audit (Round 2)

A fresh, targeted audit was run specifically for file-size/single-responsibility problems (distinct from the completed "Codebase Modularity Audit"/"Code Organization / Decomposition" work already in `CHANGELOG.md`, which covered `components/`/`lib/`/`services/`/`hooks/` more broadly). This audit was read-only — no code was changed. Two concrete, well-justified candidates came out of it; everything else considered was explicitly decided *not* worth touching, and that reasoning is preserved below so it doesn't get re-litigated or accidentally "fixed" later.

**Raw line-count scan** (top of the list, for reference — `find` + `wc -l`, excluding tests):
765 src/lib/conditionDefinitions.ts
607 src/components/CommandPalette.tsx
546 src/components/AudioLibrary.tsx
532 src/components/ActiveEncounterTab/CombatantCardHeader.tsx
502 src/components/ui/ConditionChips.tsx
502 src/components/CampaignSelector.tsx
484 src/components/PartyTab/LevelUpDialog.tsx
473 src/components/ActiveEncounterTab/hooks/useCombatantMutations.ts
449 src/services/dbOperations/encounterCombatants.ts
441 src/hooks/useAudioEngine.ts
439 src/components/PartyTab/CharacterCardExpanded.tsx
434 src/components/PartyTab/ShortRestDialog.tsx
427 src/components/PartyTab/NewPlayerDialog.tsx
417 src/services/googleAuth.ts
399 src/services/sheetsService.ts
391 src/components/ui/ResourcePoolsSection.tsx
387 src/lib/conditionDescriptions.ts
380 src/hooks/dashboardStore.ts
374 src/components/NpcLibraryTab/NpcCard.tsx
360 src/lib/combatLogic.ts

### Candidate 1 — `src/components/CommandPalette.tsx` (607 lines) — CORRECTED SCOPE, RE-INVESTIGATED

**Original audit's premise did not hold up under direct file inspection.** The original 4-cluster 
estimate (~150 setup, ~120 search/filter, ~180 command-dispatch handlers, ~157 layout render) 
assumed a distinct, extractable "command dispatch" layer entangled with rendering. Direct 
inspection of the real file found this isn't accurate:
- There is no custom search/filter/scoring logic at all — `cmdk` handles filtering natively. The 
  only search-related code is a 1-line `value={search.length >= 2 ? x.name : ''}` guard on 2 item 
  types, to avoid rendering huge Spell/Condition lists before 2+ characters are typed.
- Nearly every `onSelect` handler is a self-contained 1-4 line inline callback 
  (`window.dispatchEvent(...); onClose();` or `updateState(...); onClose();`), written directly 
  in the JSX next to its own menu item — not a separate, larger dispatch-logic block.
- The file's real length comes from verbose, repetitive JSX markup (a long `COMMAND_ITEM_CLASS` 
  string, and near-identical icon/label/`Command.Item` structure repeated ~25 times across ~9 
  command groups), not from tangled business logic.

**Only 3 functions are genuinely extractable business logic**: `testDeathAnimation`, 
`testDamageAnimation`, `testHealAnimation` — each fires a combat overlay event plus a toast, 
multi-step logic distinct from the one-line dispatches everywhere else.

**Recommendation, revised**: extracting a `useCommandExecutor.ts` hook with a generic 
`executeCommand(commandId, extraData)` dispatcher is NOT recommended — it would require either a 
large `commandId`-keyed switch (moving logic away from its own menu item, a readability regression) 
or keeping handlers as individually-exported functions called one at a time (a much smaller win 
than originally scoped). If pursued at all, extraction should be limited to just the 3 test-
animation functions. A more honest fix for this file's actual problem (repetitive JSX, not tangled 
logic) would be reducing markup duplication — e.g. a small reusable render-helper or data-driven 
`.map()` for the many structurally-identical `Command.Item`s — a different, smaller-scoped 
refactor than what's proposed here. Not yet decided whether this is worth doing at all, given the 
real win is modest either way.

**Test coverage/consumer facts, confirmed**: exactly one mount point (`GMDashboardDialogs.tsx`), 
Batch 7B-1 (`CommandPalette.test.tsx`, 8 of its 13 tests) is the relevant batch, verified currently 
passing at baseline.

### Explicitly considered and correctly NOT flagged (preserve this reasoning — do not re-flag these later)

- `src/lib/conditionDefinitions.ts` (765 lines) — cohesive: a static mechanics lookup dictionary (~640 lines) plus a small computational summarization engine (~125 lines). Long because it's a flat data table, not because it's doing too much.
- `src/components/AudioLibrary.tsx` (546 lines) — cohesive control panel (ingest/preview/organize/delete audio), 5 responsibility clusters but they're all genuinely part of one workflow.
- `src/components/ui/ConditionChips.tsx` (502 lines) — cohesive: condition selection tightly integrated with automatic mechanical effects (concentration cascade, exhaustion death, immunity checks).
- `src/components/CampaignSelector.tsx` (502 lines) — cohesive onboarding/auth page; ~352 of the lines are pure layout/list rendering, not distinct logic.
- `src/components/PartyTab/LevelUpDialog.tsx` (484 lines) — cohesive wizard modal already leveraging modular sub-components (`LevelUpChecklist`, `LevelUpResourcePools`) and hooks (`useLevelUpAutomation`).
- `src/components/ActiveEncounterTab/hooks/useCombatantMutations.ts` (473 lines) — already well-structured (separates pure helper functions from React hook logic); this is the file that was already decomposed in the "updateCombatant God Function Decomposed" work in `CHANGELOG.md`. Do not re-flag it for further splitting.
- `src/services/dbOperations/encounterCombatants.ts` (449 lines) — cohesive CRUD interface for one sheet, cleanly organized into creation/updates/deletion/NPC-specific-action clusters.
- `src/hooks/useAudioEngine.ts` (441 lines) — cohesive global audio coordinator; 8 responsibility clusters but genuinely need to share module-level state (dual-deck crossfade, gain nodes) — splitting would fragment tightly-coupled state, not simplify it.
- `src/components/PartyTab/CharacterCardExpanded.tsx` (439 lines), `ShortRestDialog.tsx` (434), `NewPlayerDialog.tsx` (427) — each cohesive, single-purpose dialogs/cards.
- `src/services/googleAuth.ts` (417 lines), `sheetsService.ts` (399 lines) — appropriately-sized low-level API/auth wrappers; length matches real protocol/flow complexity.
- `src/components/ui/ResourcePoolsSection.tsx` (391), `src/lib/conditionDescriptions.ts` (387, static rules text), `src/hooks/dashboardStore.ts` (380, the central Zustand store — cohesive by definition), `src/components/NpcLibraryTab/NpcCard.tsx` (374, already decomposed — see `CHANGELOG.md`'s `NpcCard.tsx` entity-detail decomposition), `src/lib/combatLogic.ts` (360, pure math/algorithms, no React/network coupling) — all confirmed fine as-is.
- `src/components/ActiveEncounterTab/hooks/useCombatSync.ts` (66 lines) — a clean facade delegating to already-decomposed sub-hooks (`useCombatantMutations`, `useCombatLifecycle`, `useCombatTurn`, `useCombatConcentration`). Not a candidate.
- `src/services/writeQueue.ts` (140 lines) — a single-responsibility queue implementation. Not a candidate.

### Precedent already fixed — do not re-audit or duplicate this work

The following god-hook/god-file decompositions are **already completed** (full detail in `CHANGELOG.md`) and should not be re-flagged or re-attempted by a future audit pass:
- `useParty.ts` (620 → ~80 lines): split into `usePartyRest.ts`, `usePartyLevelUp.ts`, `usePartyCharacterCrud.ts`, `partyStateHelpers.ts`.
- `NpcFormFields.tsx` / `NpcCard.tsx`: shared `NpcSimpleFieldEditor.tsx` / `NpcCombatActionFields.tsx` extracted, `NpcActionEditors.tsx` deleted as a dead duplicate.
- The full three-part card componentization effort: `CardShell.tsx` → `CardHeaderChevron.tsx` → `ExpandableContent.tsx`, adopted across `CombatantCard`/`NpcCard`/`CharacterCard` (`EncounterCard.tsx` deliberately excluded — structurally different, no expand/collapse mechanism).
- The full store-access architecture fix: `useCombatantCard.ts`/`useCombatantExpanded.ts` resolved to props at the coordinator level; all narrow store-access components (`EncounterCard.tsx`, `CombatantCard.tsx`, `CombatantCardExpanded.tsx`, `CombatantCompactResourceRow.tsx`, `GlobalActionContextPanel.tsx`) converted to pure prop-driven components. **`EncountersTab.tsx`'s violation (see Bugs to Fix, above) is the one confirmed exception this pattern was never applied to — closing that bug completes this architecture fix project in full.**

---

## Working Discipline — Lessons Baked Into This Project (read before starting any new work)

These aren't optional style preferences — they're standing requirements, established after repeated, documented incidents in `CHANGELOG.md`. Apply them to every item in this file.

1. **Never accept a "tests passed" or "verified" claim without literal, pasted, raw terminal output.** This project has caught fabricated batch numbers, fabricated per-file test names, invented rule citations (a fake "Rule 9," a fake `STYLE_GUIDE.md` quote), and narrated summaries standing in for real output — repeatedly, across dozens of separate incidents. A summary claim is not verification.
2. **Never expand scope beyond what was explicitly requested in the current step.** This project has a documented history of "while I was in there" scope creep — e.g. the Phase 3 styling incident that touched 20+ unrelated files under a mislabeled stage name, and AI Studio editing `ROADMAP.md`/`CHANGELOG.md` directly despite repeated explicit instructions not to. Confirm the exact file list before implementation on any multi-file task.
3. **Any "verbatim" or "raw" quote of a file must be independently checked against the real file before being trusted**, especially after any long gap or context switch. This project has multiple documented instances of fabricated file content presented as genuine reads.
4. **Investigate before proposing a fix — especially for anything touching shared state, rollback logic, or cross-component data flow.** Several of the most serious bugs in this project's history (the full-app-state-rollback pattern, the NPC template/combat-instance state isolation project) required real dependency-tracing before a correct, scoped fix could even be designed.
5. **When a redesign or consolidation has already happened to a file, check `CHANGELOG.md` for it before touching that file again.** `CombatantCardHeader.tsx`'s recent row redesign (see Candidate 2 above) is the current live example — do not let a structural refactor silently revert a recent, deliberate UX decision.