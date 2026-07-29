# Roadmap
Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

### 🔴 Bugs to Fix

None.

### 🟡 Features to Add / Test Coverage Gaps

None.

### 🟡 UI Refactor

#### GM Dashboard — PC/NPC Card Redesign (Full Locked Scope)

This entry replaces and consolidates every prior fragmented note on this topic. It covers three related, staged pieces of work: **(1)** the PC card (`CharacterCardExpanded.tsx`), **(2)** the shared Action/Reaction/Bonus Action/Legendary Action field editor (`NpcCombatActionFields.tsx`), and **(3)** the NPC card (`NpcCard.tsx`). The goal across all three: replace the current sprawling, heavily-boxed, hard-to-scan layout with a compact, gridded layout that reuses patterns already proven and shipped in `CombatantCardExpanded.tsx` (see `file-reference.md`), while remaining fully editable (unlike the combatant card, which is read-only).

**Traits editing is explicitly out of scope for all three pieces below** — leave `NpcListEditor`'s Traits section exactly as it is today.

Reference screenshots and locked interactive mockups for all three pieces are attached across this conversation thread — consult them for exact spacing/styling before implementing anything below, and ask before deviating from anything specified here.

---

##### Part 1 — PC Card (`CharacterCardExpanded.tsx`)

**Header:** Keep the existing layout as-is, with one addition — move the `Class` field up into the header row. The `Class` field is currently a separate `<LabeledField label="Class"><DebouncedInput ... /></LabeledField>` block further down the card; it must be RELOCATED into the header (not duplicated — remove the original block once relocated) and remain a fully editable free-text field there (its current placeholder is "e.g. Barbarian or Barbarian / Fighter" — it is not a fixed enum, so it can't become a static label the way `GM` is). Resulting header order: `[Name] | [CLASS] | [GM] ... [Active status pill] [Level Up button] | [expand/collapse chevron]`. Do not restructure, merge, or remove any other header element.

**New compact stat row**, replacing the 5 separate `StatTile` boxes (AC/Max HP/HP/Temp/Level) entirely — do not keep both old and new: a single inline row directly below the header, with a bottom divider. Left-aligned: `PROF +N` as plain text (label + value, no border/box — not directly editable, it's derived). Right-aligned, grouped together in this exact left-to-right order: `LEVEL [box]`, `AC [box]`, `HP [box]`, `TEMP [box]`, `MAX [box]`. Each is a small uppercase gray label immediately followed by a small bordered/light-background editable number input, reusing the existing `CardNumberInput` editing pattern already used elsewhere in this file — do not reinvent it.

**Ability score table:** a single bordered horizontal table (STR/DEX/CON/INT/WIS/CHA columns, score editable, modifier auto-computed below), replacing the 6 separate per-ability `StatTile` boxes entirely. Visually matches `StatBlockScoresTable.tsx`'s layout, but must remain fully editable — that existing component is read-only-only, so confirm during investigation whether to extend it with an editable mode or build a new sibling component. Do not fork duplicate markup.

**New two-column grid, directly below the ability score table:**
- **Left column — Saving Throws, then Skills, stacked:**
  - Saving Throws: all 6 shown, unchanged data/behavior from today (2-column sub-layout: STR/INT, DEX/WIS, CON/CHA — clickable proficiency toggle dot, bonus value). Do NOT reduce this to only proficient saves.
  - Skills: default view stays a flat list of only proficient/expert skills (unchanged data). Add a "Show all skills" toggle below the list. Expanding REPLACES the flat list (does not append to it) with the full skill list grouped under ability-score subheadings — STR, DEX, INT, WIS, CHA (CON omitted; no CON skills exist in 5e). Every skill in every group gets a checkbox for toggling proficiency; proficient/expert skills appear checked, styled identically to the default view (blue bonus text, `(exp)` tag); non-proficient skills appear unchecked and muted. "Show fewer skills" reverts to the flat default.
- **Right column — Passive, then Spellcasting, then Conditions, stacked in that order:**
  - Passive line: unchanged display (`Perception X · Insight X · Investigation X`).
  - **The existing `± Feat/item bonuses` expandable link below the Passive line MUST be preserved.** It toggles to "Hide passive bonuses" and reveals per-score editable override inputs for Perception/Insight/Investigation. This was not visible in the reference screenshots used to build the locked mockup and could easily be dropped by accident — locate the real component powering it (likely a small expandable sub-piece of `StatBlockPassive.tsx`) and reuse it as-is, just relocated into this new position. Do not omit it.
  - **Fix, as part of this stage:** the expanded per-score override input boxes currently render with a dark background and dark/low-contrast text (values like "0" are barely legible). This is a genuine, pre-existing contrast bug, unrelated in origin to this redesign — but it must be fixed while this section is being touched, not just flagged. Confirm the real cause (likely a stray dark-theme class or missing background override) and correct it to match this app's standard light input styling.
  - Spellcasting: the existing spellcasting-ability override dropdown (currently rendered via `SpellcastingStatsRow`'s `onOverrideChange` prop) moves here, directly below Passive/Feat-bonuses.
  - Conditions: the existing `ConditionChips` input RELOCATES here, directly below the Spellcasting dropdown, from its current lower position in the card. Do not leave a duplicate behind.

**Second two-column grid, below the grid above:**
- **Left column — Hit Dice, then Class Resource Trackers, stacked** (both are currently full-width, separate sections — now combined into one column): Hit Dice box (Config input + pip tracker, internals unchanged) directly above the Class Resource Trackers box (Ki Points/Fight or Flight/etc., internals unchanged — reuse `ResourcePoolsSection.tsx` as-is).
- **Right column — Resistances, Immunities, Vulnerabilities, stacked VERTICALLY in that order** (currently 3 side-by-side boxes via `IrvSection.tsx` — this becomes a single vertical stack). Confirm whether `IrvSection.tsx` already supports a vertical-stack layout mode via its existing props, or whether a new layout variant is needed — do not duplicate its internal logic. **Conditions does NOT appear in this grid** — it already moved to the grid above, under Spellcasting.

**New checkbox pairing:** the existing `Auto-refresh action mechanics` and `GM-Controlled Character` checkboxes must render INLINE with each other (side by side on one row), not stacked vertically as they are today.

**New fields, gated behind `gmControlled`:** GM-Controlled Characters are currently missing `Speed`, `Senses`, and `Languages` fields that NPCs already have. Add these three fields to the PC card, but ONLY visible when the existing `gmControlled` checkbox is checked — same conditional block that already gates the Traits/Actions/Reactions/Bonus Actions/Legendary Actions section. They must NOT be visible on ordinary (non-GM-controlled) PCs.

---

##### Part 2 — Action / Reaction / Bonus Action / Legendary Action Editor (`NpcCombatActionFields.tsx`)

This is the shared field editor used by `renderActionFields`, `renderReactionFields`, `renderBonusActionFields`, AND (see reversal below) `renderLegendaryActionFields` in `npcListFieldRenderers.tsx`. It currently crams ATK/DMG/DC/SAVE into one row, with the "ATK BASIS"/"DC BASIS" chip rows disconnected further down the form, and the Damage Components builder duplicating the DMG field above it. This redesign groups mechanically-related fields into three self-contained cards.

**Locked layout, top to bottom — applies identically to Actions, Reactions, Bonus Actions, AND Legendary Actions, except where explicitly noted:**

1. **Name / Recharge row** (Legendary Actions use `Cost` instead of `Recharge` — this is unchanged from today; do not add `Recharge` to Legendary or `Cost` to the other three).
2. **Three-column grid**, each column a self-contained bordered card:
   - **Attack card**: label "Attack." The existing ATK number input + its Auto button, side by side (behavior unchanged). Below that: a "Basis" label and the existing single-select `AbilitySelectChips` (Atk Basis) — **all 6 abilities (STR/DEX/CON/INT/WIS/CHA) must render**, not a subset. This chip row moves INTO this card from its current disconnected position.
   - **Damage card**: label "Damage" with the existing "Build"/"Text" toggle in the card's top-right corner (behavior unchanged, just relocated). Below that: the DMG field — disabled/greyed compiled-string preview when in structured/"Build" mode (matching existing behavior), normal editable text when in plain/"Text" mode. When structured, the `DamageComponentsBuilder` rows render NESTED INSIDE this same card (not as a separate section below) — each row's dice/type/flat-bonus inputs, a "Bonus (1 row max)" label, and the existing single-select ability chips for that row's bonus — **all 6 abilities must render here too.**
   - **Saving throw card**: label "Saving throw." The existing DC number input + its Auto button, side by side. Below that: the existing free-text Save Type input (e.g. "Con" — what the target rolls; kept as a plain field, not folded into the basis chips). Below that: a "Basis" label and the existing multi-select `AbilitySelectChips` (DC Basis, all 6 abilities).
3. **Range field** — full-width, directly below the three-card grid. **Actions/Reactions/Bonus Actions only — Legendary Actions do NOT get a Range field** (unchanged from today; do not add one).
4. **Description textarea** — full-width, at the very bottom. **This applies to ALL FOUR action types, including Legendary Actions** — the real component already passes `description`/`onDescriptionChange` for Legendary Actions today; do not exclude it.

**[DELIBERATE, CONFIRMED REVERSAL OF PRIOR PRECEDENT] Legendary Actions now get full automation parity with the other three types.** Every prior automation stage (Attack Bonus / Save DC / Damage Bonus / the 5-stage stale-value-detection feature) explicitly excluded Legendary Actions from Auto-fill UI, stating "Legendary Actions are NPC-only and don't get Auto-fill UI at all." **That exclusion was an oversight, not a design decision, and is being corrected now — confirmed directly by the project owner.** Do not treat any future inconsistency between Legendary Actions and the other three as drift to "fix back" to the old excluded state; the old state was the bug.
- Add `dcAbilities?: AbilityName[]`, `atkAbility?: AbilityName`, `dcAutoComputed?: boolean`, `atkAutoComputed?: boolean`, and `damageComponents?: DamageComponent[]` to `NpcLegendaryAction` in `types.ts` (it already has `saveDC`/`saveType`/`attackBonus`/`damage`/`cost`/`description`).
- Wire `renderLegendaryActionFields` in `npcListFieldRenderers.tsx` to pass the same automation props to `NpcCombatActionFields` that the other three renderers already pass (`abilityScores`, `proficiencyBonus`, `dcAbilities`/`onDcAbilitiesChange`/`dcAutoComputed`, `atkAbility`/`onAtkAbilityChange`/`atkAutoComputed`, `damageComponents`/`onDamageComponentsChange`).
- Extend `src/lib/automation.ts`'s `findStaleAutomatedValues()`/`recalculateAutomatedValues()` type constraints to also accept `NpcLegendaryAction` (currently scoped to `NpcAction | NpcReaction`), and confirm the stale-value toast/bulk-recalculate flow in `CharacterCardExpanded.tsx`/`NpcCard.tsx` includes `legendaryActionsList` in its stale-count check and recalculation call alongside `actions`/`reactions`/`bonusActions`.
- Find and update every existing test that asserts Legendary Actions do NOT show DC/Atk Basis chips or a damage builder — do not just add new passing tests alongside old, now-contradictory ones.

**This is otherwise a pure layout/regrouping change for the other three types** — all existing automation logic (Auto-fill handlers, the `dcAutoComputed`/`atkAutoComputed`/`bonusAutoComputed` provenance flags, stale-value indicators, the `DamageComponentsBuilder` structured builder) is reused as-is internally, not rewritten or re-verified.

**Real-width caveat:** the three-column card grid was mocked at ~720-780px card width. This form renders nested inside the already-indented `NpcListEditor` row structure, so real available width will be narrower. Confirm during implementation whether three equal columns remain legible at real widths, or whether the cards need to stack vertically instead — check against real rendered width in at least one real consumer before deciding, don't guess.

---

##### Part 3 — NPC Card (`NpcCard.tsx`)

Same overall approach as the PC card, adapted for what NPCs actually have. **Header stays unchanged** (existing `NpcCardHeader.tsx` pattern — not part of this redesign).

**New compact stat row**, same pattern as the PC card but with different fields (NPCs have no Level/HP/Temp — NPC templates don't track current/temp HP, only `maxHp`): left-aligned `PROF +N` (plain text, derived); right-aligned, grouped, in this exact order: `CR [box]`, `AC [box]`, `MAX HP [box]`.

**Ability score table:** identical pattern to the PC card (same shared/extended component).

**New two-column grid, directly below the ability score table:**
- **Left column — Saving Throws, then Skills** — identical behavior to the PC card (all 6 saves shown; Skills defaults to flat proficient-only list with a "Show all skills" toggle that replaces it with the full ability-grouped list).
- **Right column — Passive, then Spellcasting, then Speed, then Senses, then Languages, stacked in that order.** No Conditions field here — `NPC` (the template type) has no `conditions` field at all (that only exists on `Combatant`), so there is nothing to relocate.

**IRV stays unchanged** — the existing 3-column side-by-side `Resistances`/`Immunities`/`Vulnerabilities` layout (`IrvSection.tsx`, labels "Resists"/"Immune"/"Vuln") is NOT restructured for NPCs. NPCs have no Hit Dice or Class Resource Trackers, so there's no left-column content to pair it with — leave this section exactly as it is today.

**Auto-refresh checkbox:** NPCs keep the single existing `Auto-refresh action mechanics` checkbox — there is no `GM-Controlled Character` equivalent to pair it with for NPCs (that's a PC-only concept), so no inline-pairing change applies here.

**`NpcLegendarySection` must be explicitly preserved, completely unchanged.** This is the top-level `Legendary Actions`/`Legendary Resistances` NUMBER fields on the NPC itself (e.g. "3 legendary actions per turn," "0 legendary resistances") — it is entirely separate from the `NpcLegendaryAction` array/list of individual named legendary actions covered in Part 2. It currently renders directly above the Traits/Actions/Reactions/Bonus Actions/Legendary Actions list section. Do not move it, restyle it, fold it into any new grid, or otherwise touch it — flagged explicitly here because it's easy to lose track of while restructuring everything around it.

**Notes field:** stays full-width, unchanged, in its current position.

**Actions/Reactions/Bonus Actions/Legendary Actions:** use the redesigned editor from Part 2 above — no NPC-specific differences beyond what Part 2 already specifies.

- **[CORRECTION to Part 2's Locked Layout, point 3]** Legendary Actions DO get a `Range` field after all — this replaces the earlier statement that they don't. Real 5e legendary actions frequently have their own standalone area/range independent of the parent action they might reuse (e.g. a "Wing Attack" hitting everything within 15 feet, a "Tail Sweep" with its own reach) — there is no rules-based reason to exclude Range from Legendary Actions, and doing so was very likely the same kind of oversight as the automation-parity gap already being corrected above, not a deliberate design choice. Add a `range?: string` field to `NpcLegendaryAction` in `types.ts` (it doesn't have one today), and wire `renderLegendaryActionFields` to pass `rangeValue`/`onRangeValueChange` to `NpcCombatActionFields` the same way the other three renderers already do. The Range field renders in the same position as the other three types — full-width, directly below the three-card Attack/Damage/Saving-Throw grid, above Description.

- **[PREREQUISITE — COMPLETE AND VERIFIED]** ✅ Fixed and tested: `syncProficiencyBonusToCR()` (new pure helper in `src/lib/abilityScores.ts`) is now wired into `NpcCard.tsx`'s CR-change handler in both branches, merged into the same single `onUpdate` call as `challengeRating` (no race condition). `useNpcCrAutomation.ts` refactored to call the same helper, `NewPlayerDialog.tsx`'s creation-time behavior unchanged. Verified: `tsc` clean, Batch 1 508/508 (includes 4 new direct unit tests for the helper), Batch 6C 36/36 (includes a dedicated single-`onUpdate`-call regression test). The override removal below is now unblocked and safe.
- **Only once that prerequisite is verified**, the Proficiency Bonus manual override input (`ProficiencyOverrideInput` in `StatBlockScores.tsx`) is removed entirely — for both PCs and NPCs, no exceptions. `PROF +N` becomes purely derived, non-editable display text in the new compact stat row on both cards (PCs: `proficiencyBonusFromLevel(character.level)`; NPCs: `proficiencyBonusFromCR(npc.challengeRating)`). No manual override path remains anywhere in the app after this.

---

##### Investigation Findings — Locked (from pre-Stage-1 investigation)

These are confirmed facts about the real current code, gathered before Stage 1 begins, to prevent re-investigation or incorrect assumptions:

- **The real ability-score editing mechanism is NOT `CardNumberInput` or `StatBlockScoresTable.tsx`.** It's `StatBlock.tsx` → `StatBlockScores.tsx`, which contains its own local `AbilityScoreInput` component (buffered local state, commits on blur/Enter, clamped 1-30) rendered inside 6 `StatTile` boxes via `flex flex-wrap`. `StatBlockScoresTable.tsx` (the read-only bordered-table component referenced in Part 1's "Ability score table" section) is a *different*, currently unused-for-editing component. Stage 1 must build an editable variant of `StatBlockScoresTable.tsx` (recommended: add an optional `onScoreChange?: (ability: AbilityName, value: number) => void` prop, replacing the static score `<div>` with an input when present) that replicates `AbilityScoreInput`'s exact buffered-commit + 1-30 clamp behavior — then use that new editable table to replace `StatBlockScores.tsx`'s current `StatTile`-grid rendering (SECTION A) inside `StatBlock.tsx`.
- **`StatBlockScores.tsx` also currently owns the entire Proficiency Bonus row** (SECTION B — display value + the `ProficiencyOverrideInput` now being removed per the locked decision above). Once the override is removed, SECTION B should be deleted from `StatBlockScores.tsx`/`StatBlock.tsx` entirely — `PROF` moves out and becomes a directly-computed value rendered in the new compact stat row inside `CharacterCardExpanded.tsx` (`proficiencyBonusFromLevel(character.level)`) and, later in Part 3, `NpcCard.tsx` (`proficiencyBonusFromCR(npc.challengeRating)`). No ternary/override-branch logic is needed anymore — `NpcCard.tsx` already renders `<StatBlock>` without a `characterLevel` prop, and that's fine to leave as-is since NPCs never derived PROF from level in the first place.
- **`StatBlockPassive.tsx`'s dark-background contrast bug root cause is confirmed**, not just suspected: the expanded override panel is hardcoded with `bg-stone-800/40 border-stone-700/50`, and each input has `bg-stone-800 border-stone-600 text-stone-200` — genuine leftover dark-theme Tailwind classes never updated to this app's light theme. Straightforward fix: swap to standard light input styling matching the rest of this file.
- **`IrvSection.tsx` confirmed to have no `direction`/`layout` prop today** — it's hardcoded `grid grid-cols-1 sm:grid-cols-3` (a responsive breakpoint collapse, not an on-demand layout switch). A new prop is needed (e.g. `direction?: 'row' | 'column'`, default `'row'` preserving today's behavior for the NPC card's unchanged usage in Part 3, `'column'` forcing `grid-cols-1` unconditionally for the PC card's new vertical IRV stack in Part 1).
- **`CardNumberInput.tsx`'s real prop shape is confirmed**: `value, onChange, fallback=0, min, max, className, disabled, title, placeholder` — matches what Part 1's stat row section already assumes, no discrepancy.

---

##### Implementation discipline (applies to all three parts)

Expected multi-stage effort — implement and verify in this order, following the same staged discipline used for every prior feature this session (investigate real current code first, lock each stage's design, verify with raw terminal test output before moving to the next stage, never accept "tests passed" without literal output):

1. PC card: stat row + ability table.
2. PC card: saves/skills/passive/spellcasting/conditions grid, including the feat/item-bonus preservation and contrast-bug fix.
3. PC card: hit-dice/resources/IRV grid, GM-controlled checkbox inline-pairing, and the new gated Speed/Senses/Languages fields.
4. Action/Reaction/Bonus Action/Legendary Action editor: three-card layout regroup.
5. Action/Reaction/Bonus Action/Legendary Action editor: Legendary Action automation-parity reversal (types, renderer wiring, `automation.ts` extension, test updates).
6. NPC card: stat row + ability table + saves/skills/passive/spellcasting/speed/senses/languages grid (reusing everything already built for the PC card wherever the underlying component is shared).

A pure layout change should not require rewriting existing, still-valid test assertions — only update tests that were genuinely asserting DOM structure/positions this redesign legitimately alters. Every stage needs full-batch raw test output (not just the files assumed to be affected) before being marked complete.

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