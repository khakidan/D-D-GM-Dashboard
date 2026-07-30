# Roadmap
Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

### 🔴 Bugs to Fix

None.

### 🟡 Features to Add / Test Coverage Gaps

None.

## file-reference.md Accuracy & Organization Audit (Findings confirmed via raw directory listing — ready for edit pass)

A review of `docs/agents/file-reference.md` against the real codebase, verified against actual raw `view` directory output (not just synthesized summaries), turned up factual inaccuracies, undocumented files, and organizational opportunities. Recorded here for a future dedicated pass — do not fix inline as a side effect of unrelated work.

### Organizational proposal — `src/components/ui/` (5 subfolders)
Refined across two passes. One correction adopted: **`NpcStatBlockSection.tsx` belongs with the display/stat-block family, not the editing family** — it's a read-only display component used by `NpcCard.tsx`, not part of the `NpcFormFields.tsx` editing-tab decomposition.
- **`npc-editor/`** (9 files): `NpcFormFields.tsx`, `NpcIdentityTab.tsx`, `NpcCombatTab.tsx`, `NpcAbilitiesTab.tsx`, `NpcStatBlockTab.tsx`, `NpcListEditor.tsx`, `NpcSimpleFieldEditor.tsx`, `NpcCombatActionFields.tsx`, `npcListFieldRenderers.tsx`
- **`stat-block/`** (6 files): `StatBlock.tsx`, `StatBlockScoresTable.tsx`, `StatBlockSaves.tsx`, `StatBlockPassive.tsx`, `StatBlockSkills.tsx`, `NpcStatBlockSection.tsx`
- **`inputs/`** (9 files): `Button.tsx`, `IconButton.tsx`, `Badge.tsx`, `ToggleBadge.tsx`, `SearchInput.tsx`, `DebouncedInput.tsx`, `DebouncedTextarea.tsx`, `PipTracker.tsx`, `CardNumberInput.tsx`
- **`combat/`** (11 files): `ConditionChips.tsx`, `ConditionDurationPrompt.tsx`, `ConditionPopover.tsx`, `ConditionSearchDropdown.tsx`, `DamageComponentsBuilder.tsx`, `AbilitySelectChips.tsx`, `IrvMultiSelect.tsx`, `IrvSection.tsx`, `ResourcePoolManager.tsx`, `ResourcePoolsSection.tsx`, `SpellcastingStatsRow.tsx`
- **`layout/`** (12 files): `CardShell.tsx`, `CardHeaderChevron.tsx`, `DashboardLayout.tsx`, `DialogShell.tsx`, `SectionHeader.tsx`, `SettingsPanel.tsx`, `Tabs.tsx`, `Accordion.tsx`, `Callout.tsx`, `EmptyState.tsx`, `ExpandableContent.tsx`, `markdownComponents.tsx`
Note: `layout/` is coarser than the "three-part card componentization effort" (`CardShell`/`CardHeaderChevron`/`ExpandableContent`) that `file-reference.md`'s own text already describes as a deliberately staged, cohesive unit — consider a separate `card-primitives/` folder for that trio plus `StatTile.tsx` (not assigned a home in either pass) rather than absorbing them into the broader `layout/` grouping. `ConfirmationDialog.tsx` and `LabeledField.tsx` also weren't assigned in either pass and need a home (likely `layout/` or their own small group).

### Organizational proposal — `src/components/` root (confirmed via second pass, with real evidence)
1. **`overlays/`** (6 files, not 7 as originally proposed): `DamageOverlay.tsx`, `DeathOverlay.tsx`, `HealOverlay.tsx`, `InitiativeOverlay.tsx`, `RageOverlay.tsx`, `UnconsciousOverlay.tsx`, plus `FilmGrainLayer.tsx` (a shared presentation utility consumed by all 6). Confirmed via real quotes: all 6 share the same `useCombatOverlayEvents.ts`-driven event/duration pattern and `FilmGrainLayer.tsx` texture integration.
   - **`SyncingOverlay.tsx` explicitly excluded** — despite the name, it's a real interactive dialog (status logs, buttons, manual re-auth flow), not a timed cinematic transition. Correctly identified as not belonging to this family; should stay elsewhere (with settings/sync-related components) rather than being swept in by name alone.
2. **`settings/`** (4 files): `SettingsPage.tsx`, `SheetConnectionSettings.tsx`, `GMTestingTools.tsx`, `ReferenceDataSeeder.tsx`. Confirmed via a real import quote from `SettingsPage.tsx` that all three sub-components are exclusively imported there, mirroring the existing `src/components/auth/` precedent.
3. **`audio/`** (7 files, new finding from this pass, not originally proposed): `AmbientPlayer.tsx`, `AudioFileRow.tsx`, `AudioLibrary.tsx`, `AudioLibraryDropzone.tsx`, `AudioPanel.tsx`, `Soundboard.tsx`, `MoodAssignmentPopover.tsx` (confirmed via import quote as used exclusively inside `AudioFileRow.tsx`). A reasonable, well-evidenced addition worth adopting alongside the other two.

After these three groupings, remaining root-level components (`PlayerView.tsx`, `CampaignSelector.tsx`, `CommandPalette.tsx`, `DiceRoller.tsx`, `ErrorBoundary.tsx`, `GMDashboard.tsx`, `GMDashboardDialogs.tsx`, `GMDashboardSidebar.tsx`, `GMLoadingScreen.tsx`, `GMTabContent.tsx`, `GlobalControls.tsx`, `ScrollToTop.tsx`, `SidebarIcon.tsx`, `SyncStatusIndicators.tsx`, `SyncingOverlay.tsx`) are reasonably standalone/dashboard-shell-level and don't obviously need further grouping.

**Next steps:**
1. Any subfolder reorganization (`ui/` 5-6-way split, `overlays/`, `settings/`, `audio/`) remains optional, import-path-only work — do as an isolated, dedicated pass with a full type-check + full test suite run afterward, not bundled with feature work.

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