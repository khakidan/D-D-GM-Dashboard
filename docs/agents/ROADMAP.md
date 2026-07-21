# Roadmap

Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

Features and bugs that have been discussed and approved but not yet implemented. Each entry contains enough context to implement without further discussion.

### 🔴 Bugs to Fix

None currently open.

### 🟡 Features to Add

**Other future audit categories:**

**Performance — 2 of 4 findings fixed (see `CHANGELOG.md`); 2 smaller items still open below.** The core finding (no memoization anywhere, causing every card to re-render on every state change) and the broad `useCombatantCard`/`useCombatantExpanded` state-subscription problem have both been fixed and verified. Remaining:

- **Unmemoized filtering/search work in component bodies.** `ConditionChips.tsx` (lines 147-158), `IrvMultiSelect.tsx` (line 55), and `AddCombatantDialog.tsx` (line 56) all rebuild filtered option lists directly in the component body on every render, rather than only when the underlying query or options actually change. Given the lists involved (conditions, IRV options, the NPC library) aren't especially large, the per-render cost here is likely modest on its own — worth fixing, but it's a smaller, standalone item now that the card-level re-render issue is resolved.

- **A real, pre-existing type discrepancy surfaced while cleaning up `ActiveEncounterTab/index.tsx`, not yet reconciled.** While fixing the card memoization, a seemingly-redundant separate `useDashboardStore(s => s.combatState)` subscription was found alongside the already-available `state.combatState` (from `useAppState()`) — same underlying data, subscribed to twice. Attempting to remove the redundant one and use `state.combatState` everywhere surfaced a real type error: `AppState`'s own `combatState.actionContext.actionType` is typed as a loose `string` (in `types.ts`), but the Zustand store's internal type for the same field (in `dashboardStore.ts`) is the narrower `ActionType` union that `GlobalActionContextPanel` actually requires. The cleanup was reverted rather than fixing this as a side effect of a performance pass — the separate subscription is being kept intentionally for now, with a comment in `index.tsx` explaining why, so nobody re-attempts the same cleanup and re-discovers this. Properly resolving it means deciding whether `AppState`'s type in `types.ts` should be widened to match `ActionType`, or whether there's a reason for the current looser type — worth a dedicated look rather than folding into an unrelated change.

- **A real architectural tension worth resolving deliberately, not fixed as part of this pass.** `patterns.md`'s "Store-access architecture" principle says leaf/mid-tree components shouldn't call `useAppState()`/`useDashboardStore()`/`getSnapshot()` directly — that access should be resolved once at the top-level coordinator and threaded down as props. The `useCombatantCard`/`useCombatantExpanded` fix (see `CHANGELOG.md`) narrowed those hooks' store subscriptions rather than removing them, which is a deliberate, documented exception to that rule (see `patterns.md`), not an oversight — but it does mean `CombatantCard.tsx` (a leaf component) still reads from the store, just narrowly instead of broadly. The fully-consistent alternative would be resolving `isActiveTurn`/`isSelected`/`isSyncing` at `ActiveEncounterTab/index.tsx` (all 3 are already available there via existing hook calls) and passing them down as props, matching how `pcCharacter`/`npcModel` already work and fully closing this gap. Not done here because it's a larger refactor than a performance pass warranted, and the current fix is already verified safe and effective — but worth doing at some point for architectural consistency if that matters more than the extra refactor risk.

All 4 audit categories have now been directly investigated. Security, type safety, and accessibility have all been fixed (see `CHANGELOG.md` for all 3). Performance is mostly fixed — 2 smaller items remain open above.