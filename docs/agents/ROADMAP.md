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

**Performance — 3 of 4 findings fixed (see `CHANGELOG.md`); 1 item still open below, deliberately not being rushed.**

- **A real architectural tension worth resolving deliberately, not fixed as part of this pass.** `patterns.md`'s "Store-access architecture" principle says leaf/mid-tree components shouldn't call `useAppState()`/`useDashboardStore()`/`getSnapshot()` directly — that access should be resolved once at the top-level coordinator and threaded down as props. The `useCombatantCard`/`useCombatantExpanded` fix (see `CHANGELOG.md`) narrowed those hooks' store subscriptions rather than removing them, which is a deliberate, documented exception to that rule (see `patterns.md`), not an oversight — but it does mean `CombatantCard.tsx` (a leaf component) still reads from the store, just narrowly instead of broadly. The fully-consistent alternative would be resolving `isActiveTurn`/`isSelected`/`isSyncing` at `ActiveEncounterTab/index.tsx` (all 3 are already available there via existing hook calls) and passing them down as props, matching how `pcCharacter`/`npcModel` already work and fully closing this gap. Not done here because it's a larger refactor than a performance pass warranted, and the current fix is already verified safe and effective — worth doing at some point for architectural consistency if that matters more than the extra refactor risk, but deliberately held off on for now rather than rushed through as a quick fix.

All 4 audit categories have now been directly investigated. Security, type safety, and accessibility have all been fixed (see `CHANGELOG.md` for all 3). Performance is nearly fully fixed — 1 deliberately-deferred item remains open above.