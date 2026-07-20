# Roadmap

Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

Features and bugs that have been discussed and approved but not yet implemented. Each entry contains enough context to implement without further discussion.

### 🔴 Bugs to Fix

None currently open.

### 🟡 Features to Add

**Quick temporary HP entry during combat.** Currently there's no fast way to add temporary hit points to a combatant mid-combat. Needs a quick-add UI (similar in spirit to the existing damage/heal inputs) for setting/adding temp HP on a combatant. Once set, temp HP should display separately from current HP in 2 places where it currently isn't shown at all: (1) `PlayerView.tsx`'s combatant table, and (2) the Active Encounter combatant card in its closed/collapsed state (currently temp HP is presumably only visible once a card is expanded, if at all — needs confirming against the real current component). Reported from tonight's game session (2026-07-18).

**Quick temporary AC entry during combat.** No fast way to add a temporary AC bonus to a combatant mid-combat. Motivating example from tonight's session: an NPC's legendary action granted +2 AC for a round, and there was no way to apply this in the Active Encounter view. Needs a quick-add UI similar to the temp HP feature above, and should likely reuse/extend the same `tempAcModifier` field already used for condition-based AC changes (confirm this is the right integration point against the real code before implementing, rather than introducing a second, separate temp-AC mechanism). Reported from tonight's game session (2026-07-18).

**Recharge-ability prompt on NPC turn start.** When an NPC has an action or legendary action with a recharge trait (e.g. "Recharge 5-6"), there's currently no prompt reminding the GM to roll for it — easy to forget. Needs a prompt/reminder (similar to the existing death-save reminder shown on `nextTurn`) that fires when it becomes an NPC's turn and they have at least one un-recharged recharge ability, offering a quick roll action. Reported from tonight's game session (2026-07-18).

**Full Codebase Audit (bugs → componentization → UI uniformity).** Comprehensive pass for logic errors/bugs, oversized files needing decomposition, and UI/UX uniformity closer to established D&D apps (D&D Beyond, Roll20 conventions). Bug-hunting, componentization, and Phase 3 (UI uniformity/`STYLE_GUIDE.md` compliance) are all now complete — see `CHANGELOG.md`.

**Other future audit categories, discussed but not yet started** — beyond bug-hunting, componentization, and the findings above, a professional React/TypeScript codebase review typically also covers:

- **Type safety** — a systematic sweep for `any`/unsafe type casts, missing null checks, and places where TypeScript's strictness is being worked around rather than honored.
- **Accessibility (a11y)** — semantic HTML, ARIA attributes, keyboard navigation, focus management.
- **Security** — this app handles real OAuth tokens and writes to a GM's actual Google Sheets. Worth checking `dangerouslySetInnerHTML` usage, how tokens are stored/read, and injection risk from user-generated content (NPC names, notes, etc.) rendered without sanitization.
- **Performance** — unnecessary re-renders, missing or excessive memoization, expensive computations re-running on every render unnecessarily.

Not yet scoped as concrete audit prompts — to be run the same way as the componentization audit (isolated, evidence-required categories) once prioritized.