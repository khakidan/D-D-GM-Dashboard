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

None currently open. Security, type safety, accessibility, and performance have all been directly investigated and fixed (see `CHANGELOG.md`) — the last open performance item (the `useCombatantCard`/`useCombatantExpanded` leaf-component store-access exception) was resolved by fully threading `isActiveTurn`/`isSelected`/`isSelectable`/`isSyncing` and the combatant-mutation functions down as props from `ActiveEncounterTab/index.tsx`, closing the gap `patterns.md` previously documented as a deliberate, temporary exception.