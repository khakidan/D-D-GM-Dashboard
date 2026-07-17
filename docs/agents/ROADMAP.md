# Roadmap

Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

Features and bugs that have been discussed and approved but not yet implemented. Each entry contains enough context to implement without further discussion.

### 🔴 Bugs to Fix

None currently open.

### 🟡 Features to Add

**Full Codebase Audit (bugs → componentization → UI uniformity).** Comprehensive pass for logic errors/bugs, oversized files needing decomposition, and UI/UX uniformity closer to established D&D apps (D&D Beyond, Roll20 conventions). Phase 3 (UI uniformity) has a concrete starting point now (see below) but has not yet been worked.

**Phase 3 starting point — real, evidenced `STYLE_GUIDE.md` violations, confirmed directly against real line numbers and class names.** The app's single mandated theme is "Minimalist Sleek" (`STYLE_GUIDE.md` explicitly forbids the old "warm parchment" palette by name and hex code), but that legacy palette is still actively in use in multiple places:
- `NewPlayerDialog.tsx`'s sub-tabs (`IdentityTab.tsx`, `CombatTab.tsx`): `border-stone-200`, `text-stone-800`, `focus:border-amber-400`/`focus:ring-amber-400` on inputs — should be the mandated `focus:border-[#2563eb]`.
- `App.tsx`: the "Authenticating..." loading screen still uses `bg-[#2c2c26]`, the old dark "Stone" charcoal.
- `ShortRestDialog.tsx`: `border-amber-200/50` — `STYLE_GUIDE.md` explicitly forbids any `bg-amber-`/`text-amber-*` usage.
- `CharacterCardExpanded.tsx`: `text-[#20201a]`, an old warm-palette near-black.
- `MultiTargetActionPanel.tsx`, `Badge.tsx`, `ResourcePoolManager.tsx`, `PipTracker.tsx`: residual amber variants.

Not yet fixed — this needs a real, careful pass (confirm each instance directly against the file, not just this list, before changing anything) given the number of files involved.

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