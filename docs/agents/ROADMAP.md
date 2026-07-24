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

### Candidate 1 — `src/components/CommandPalette.tsx` (607 lines)

**Problem, precisely**: this file mixes two genuinely distinct responsibilities — `cmdk`-based UI layout/rendering, and business-logic command dispatch (search/filter matching, and the actual action handlers for adding monsters, starting combat initiatives, casting spells, applying condition filters, rolling dice, toggling ambient music decks). The dispatch logic has zero UI concerns and is fully unit-testable in isolation once separated; right now it's entangled with the render tree.

**Responsibility breakdown** (from the audit, for reference):
- Palette setup & sub-state (~150 lines): props, `open`/`query`/`searchHistory` state, DOM refs, backdrop handlers.
- Search & dynamic option filtering (~120 lines): `filterItems`, search index matching, query-sorting, command scoring.
- Command selection handlers (~180 lines): the actual action executors — this is the piece to extract.
- Custom component layout renderer (~157 lines): `cmdk` DOM, grouped lists, item rows, icons.

**Proposed split**:
- **Keep in `CommandPalette.tsx`**: the `cmdk` wrapper, open/close state, backdrop animation, container markup, search/filter logic (arguably could move too, but the dispatch handlers are the clearest, highest-value first cut).
- **Extract to `src/components/CommandPalette/hooks/useCommandExecutor.ts`**: every command-dispatch function (search-command matching, character-action firing, dice-roll launching, etc.).

**Constraint carried over from `CHANGELOG.md` — do not lose sight of this**: no prior CommandPalette-specific decomposition exists yet, so there's no risk of undoing earlier work here. Standard risk applies: this file is imported broadly (Cmd+K is global), so the relevant test batch (Batch 7B-1, which covers `CommandPalette.test.tsx` via `GMDashboard.test.tsx` integration) must be run in full, with raw output, both before and after.

### Candidate 2 — `src/components/ActiveEncounterTab/CombatantCardHeader.tsx` (532 lines)

**Problem, precisely**: this file bundles the collapsed combatant-card header layout with two fully self-contained, independently-stateful popover widgets (Temp AC stepper, Temp HP stepper) that have their own local state, click-outside-to-close handling, and interactive markup — none of which needs to live in the parent header file.

**Responsibility breakdown** (from the audit, for reference):
- Setup & properties (~45 lines).
- PC spellcasting DC & modifier computation (~40 lines).
- Temporary AC stepper component (~75 lines): `showTempAcStepper` state, click-outside hook, stepper markup.
- Temporary HP stepper component (~65 lines): `showTempHpStepper` state, click-outside hook, stepper markup.
- Primary combatant info renderer (~130 lines): name, initiative, status icons, death-save checkers.
- Status badges & controls renderer (~177 lines): reaction badges, resource pool tracking, condition badges.

**Proposed split**:
- **Keep in `CombatantCardHeader.tsx`**: grid layout, name heading, initiative input, condition indicator bars, the two rows' overall structure.
- **Extract to `src/components/ActiveEncounterTab/TempAcPopover.tsx`**: the Temp AC stepper's state, click-outside hook, and controls.
- **Extract to `src/components/ActiveEncounterTab/TempHpPopover.tsx`**: the Temp HP stepper's state, click-outside hook, and controls.

**⚠️ Critical constraint — this file was recently, deliberately redesigned. Read this before touching it.** See `CHANGELOG.md`'s "PC Combatant Card Header Redesign (Completed) — 4 Rows Down to 2" entry: this file went through careful, multi-round, user-reviewed mockup iteration to go from 4 rows down to 2 (Row 1: vitals — Init/name/AC/HP/damage+heal controls/chevron, plus spell-stat text and the restructured death-save tracker; Row 2: status — Reaction toggle, resource-pool `PipTracker` pips, mechanical/health badges). **Any popover extraction must preserve this exact 2-row structure and every specific decision made in that redesign** — do not let a refactor pass silently revert font sizes, badge wording (e.g. `VULNERABLE` as a real `Badge`, not a dot), or the row-1/row-2 content split. Also note: `CombatantCardHeader.tsx`'s name field is **deliberately non-editable** (plain `<h3>`, not a `DebouncedInput`) — this is intentional (you don't rename a combatant mid-fight), not an oversight to "fix" during extraction.

**Verification requirement for both candidates**: raw, complete batch output (not summaries) for every batch touching the modified files, both before starting and after each extraction step. Given this project's repeated history of fabricated/narrated test output (see the many process-note entries throughout `CHANGELOG.md`), treat any unverified "tests passed" claim as unverified until literal terminal output is pasted.

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