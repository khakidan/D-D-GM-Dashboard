# Roadmap

Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

Features and bugs that have been discussed and approved but not yet implemented. Each entry contains enough context to implement without further discussion.

### 🔴 Bugs to Fix

None currently open.

### 🟡 Features to Add

**Full Codebase Audit (bugs → componentization → UI uniformity).** Comprehensive pass for logic errors/bugs, oversized files needing decomposition, and UI/UX uniformity closer to established D&D apps (D&D Beyond, Roll20 conventions). Phase 3 (UI uniformity) has not yet started and is the next phase to scope.

**Open leads, not yet scoped as concrete work:**

- `NpcFormFields.tsx`'s `Abilities`/`Stat Block` tabs are still inline while `Identity`/`Combat` were already extracted — an inconsistent decomposition worth finishing.
- `useParty.ts`, `useCombatSync.ts`, and `ActiveEncounterTab/index.tsx` are worth a fresh file-size check.
- `campaigns.ts`'s inlined 7-sheet schema definition, `schema.md`, and `useSheetSync.ts`'s expectations all need to agree on one schema — currently no single source of truth across all three.
- A reusable loading-spinner component may be worth extracting — inline `Loader2` used with varying sizes across several buttons/dialogs.
- **Server-side error response shaping** — `campaigns.ts` and `auth.ts` both hand-build `{ error, message }` JSON error responses with a similar shape but not identical conventions; worth a real comparison before deciding if it's worth consolidating.
- **Possibly a shared tabbed-entity-form pattern** — `NpcFormFields.tsx` and `NewPlayerDialog.tsx` are structurally similar (Identity/Combat/Abilities + one more tab); needs an honest side-by-side check before treating it as a real candidate.

### 🔵 Architecture / Technical Debt

- **`abilityScores.ts` and `spellcasting.ts` have a circular import.** `abilityScores.ts`'s `parseProficiencies()` calls `parseSpellcastingAbility()` from `spellcasting.ts`; `spellcasting.ts` needs `abilitiesInOrder`/`AbilityName` from `abilityScores.ts`. A genuine fix would require either moving `parseSpellcastingAbility`/`SpellcastingAbility` into `abilityScores.ts` (a domain mismatch) or restructuring `parseProficiencies()` to no longer call into `spellcasting.ts` directly (would change a working function's signature and require updating every caller). Deliberately deferred — real complexity/risk for a purely architectural benefit, not a functional one.
- **54 pre-existing TypeScript errors across 18 test files** (visible only under the broader `npx tsc --noEmit`, not the build-scoped `npx tsc -p tsconfig.build.json --noEmit`). Every one is a test-file type mismatch: mock/fixture objects missing properties that real interfaces now require (`Encounter` missing `status`/`difficultyName`, `Combatant` missing `ac`/`maxHp`/`currentHp`/`passivePerception`, `CombatState` missing `combatStarted`/`actionContext`, `NPC` missing/gaining fields, a `deleteDimension` property referenced that doesn't exist on `BatchRequest`, `WriteValue` not assignable to `string` in a few sheet-write assertions, 2 unused `@ts-expect-error` directives). Worth a real triage pass at some point.

**Future audit categories, discussed but not yet started** — beyond bug-hunting and componentization, a professional React/TypeScript codebase review typically also covers:

- **Type safety** — a systematic sweep for `any`/unsafe type casts, missing null checks, and places where TypeScript's strictness is being worked around rather than honored.
- **Accessibility (a11y)** — semantic HTML, ARIA attributes, keyboard navigation, focus management.
- **Security** — this app handles real OAuth tokens and writes to a GM's actual Google Sheets. Worth checking `dangerouslySetInnerHTML` usage, how tokens are stored/read, and injection risk from user-generated content (NPC names, notes, etc.) rendered without sanitization.
- **Performance** — unnecessary re-renders, missing or excessive memoization, expensive computations re-running on every render unnecessarily.
- **Error handling consistency** — client-side async error handling hasn't been checked for consistency — are failures always caught, and always surfaced to the GM the same way, or does the pattern vary file to file?
- **Code smells beyond duplication** — magic numbers/strings that should be named constants, deeply nested conditionals, dead code or unused exports, "god functions" doing too many unrelated things.

Not yet scoped as concrete audit prompts — to be run the same way as the componentization audit (isolated, evidence-required categories) once prioritized.