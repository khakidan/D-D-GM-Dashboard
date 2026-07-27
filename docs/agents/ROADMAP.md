# Roadmap
Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

### 🔴 Bugs to Fix

- **`checkAndCaptureToken()` is called redundantly on every mount of any component using `useGoogleAuth`** (`App.tsx` calls it once on load; `initGoogleAuth()`, used by both `GMDashboard` and `CampaignSelector`, calls it again independently). Currently harmless only because the OAuth CSRF `state` check discards the second, stale attempt every time. Low priority: add a module-level "already processed this URL's code" flag so `initGoogleAuth()` skips re-attempting the exchange if already handled.

### 🟡 Features to Add / Test Coverage Gaps

- **Tiny doc-precision fix, `dashboardStore.ts`'s `getSnapshot()` comment.** Harmless (confirmed zero live bugs), but the comment claims to "return only the AppState fields, not the store methods" while also silently excluding `activeCombatLog` (real state, not a method). Recommended: `// Return only the core Sheets-synchronized AppState-shaped fields. // Note: Extended state like activeCombatLog and store methods are excluded. // Call useDashboardStore.getState() directly if the combat log is needed.`

- **`NpcCard.tsx`'s Legendary Actions tests don't directly assert name-field editing** — only initial render, cost-editing, and add/remove are directly tested. Low priority; the underlying wiring was separately confirmed correct by direct code inspection.

- Look into having the Attack bonus for PC's and NPC's be automated based on their ability score and proficiency bonus.
- Look at calculating the damage bonus based on if they have proficiency with the weapon.
  - For D&D 5e (2014 and 2024):
    * Attack bonus = Ability modifier + Proficiency bonus (if you’re proficient with the weapon or spell)
      * Melee weapons usually use Strength.
      * Finesse weapons can use Strength or Dexterity.
      * Ranged weapons usually use Dexterity.
      * Spell attacks use your spellcasting ability.
    * Damage bonus = Ability modifier
      * Add the same ability modifier used for the attack.
      * Do not add your proficiency bonus to damage.
      * Some class features, spells, or magic weapons can add extra damage.
    * Example:
      * Strength 16 (+3), proficiency bonus +2, using a longsword you’re proficient with:
        * Attack: +5 (+3 Strength +2 proficiency)
        * Damage: 1d8 +3 slashing 

- Look into automating the SAVING throw scores based on the definition of the action/reaction/etc..
  - Save DC = 8 + Proficiency Bonus + Relevant Ability Modifier(s)

- The Reactions section needs to have the ability to add a tracker to it that would allow me to keep track of reactions that can only be used a certain number of times.
  - We should also change the logic of the resource trackers so that it can account for things like only usable a certain number of times per day.

- Add the ability to collapse individual actions, reactions, bonus actions, etc... so that it doesn't become hard to see

- Reactions should probably have the same fields as Actions, Bonus Actions, etc..

- We should add the CR rating to the collapsed header for NPCs on the NPC Library page, it should go next to the HP and AC area. We should also add a filter by CR rating, like how we have for damage resistances, immunities, and vulnerabilities.

- If the NPC library doesn't have a paging system, we should add one so that we don't have to load all of the NPCs in the library (unless we want to). Maybe the default should be 10, but it could also go to 25, 50, 100, and all / page??

- NPCs who have legendary actions and resistances should be added to the collapsed view for NPC library. It should be in the same line as the Spell Casting SAVE DC and Spell Attack.

### 🟡 UI Refactor

- Fix the legendary actions layout so that it doesn't push the cost field down lower than the Action name field. Maybe but put a name label above the name field?

- We should rework the way the NPC and PC cards display and edit the AC, Max HP, Temp HP, Level/CR and ability scores. Maybe model it after the way we refactored the Combatant card.

- Change the look of an open card (PC, NPC, Combatant) so that it's easier to know when one is collapsed compared to expanded.

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