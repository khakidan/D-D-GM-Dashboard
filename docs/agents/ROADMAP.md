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

**Accessibility — 2 of 3 audit findings fixed (see `CHANGELOG.md`); 1 still open below.** The focus-indicator and icon-only-control findings from the original audit have been fixed and verified. The remaining finding is large enough in scale that it was deliberately scoped out of that round and still needs its own pass:

- **~56 form inputs across ~28 files with no `aria-label`, `aria-labelledby`, or `htmlFor`-linked `<label>`** — spot-checked directly, not just pattern-matched (e.g. the damage-amount input in `CombatantHealthControls.tsx:41` has only a `placeholder="0"`, and the ability-score input in `StatBlockScores.tsx:33` has no `id`, label, or `aria-label` at all). This is a large, systemic gap, not isolated. Given the scale, this needs a careful, incremental pass rather than a bulk fix — many of these likely have a visually-adjacent label a sighted user would associate correctly (e.g. a "DMG" button right next to the input), which doesn't help a screen-reader user since there's no programmatic association. Fixing this well means checking each one's actual visual/functional context individually, not blindly adding a generic `aria-label` to all 56.

**⚠️ Given how badly the earlier type-safety fix attempt went (see `CHANGELOG.md`), apply the same discipline here when this gets implemented**: fix one component at a time, verify the real, current file content before and after each change, and don't let a fix for one input turn into a wholesale rewrite of its surrounding file.

**Performance — audited directly, real findings below, not yet fixed.** Same direct-inspection approach as the accessibility audit above.

- **No component-level memoization exists anywhere in the app, confirmed by direct count.** Zero `React.memo` usages across the entire `src/components` tree. Only 5 files use `useMemo` at all, and only 1 uses `useCallback`, out of the whole app. This isn't a scattered gap — it means memoization is essentially absent as an architectural pattern.

- **Concretely, this means every list-rendering tab re-renders every card on every state change, not just the affected one.** Verified directly in all 4 main list tabs: `ActiveEncounterTab/index.tsx` (`CombatantCard`), `PartyTab.tsx` (`CharacterCard`), `NpcLibraryTab.tsx` (`NpcCard`), `EncountersTab.tsx` (`EncounterCard`) — none of the 4 card components are wrapped in `React.memo`, and all 4 `.map()` call sites pass freshly-created inline arrow functions as callback props on every single render (e.g. `onToggleExpand={() => toggleExpand(char.id)}`, `onUpdate={(updates) => handleUpdate(char.id, updates)}` in `PartyTab.tsx`). This second part matters even if `React.memo` gets added on its own: a fresh function reference every render means `React.memo`'s shallow prop comparison would never see equal props, so simply adding `React.memo` without also stabilizing these callbacks (via `useCallback`) would accomplish nothing. `ActiveEncounterTab` additionally subscribes to the entire `combatState` object from the Zustand store as one piece (`useDashboardStore(s => s.combatState)`, not destructured with `useShallow`), meaning the whole component re-renders on any combat-state change, cascading down to every card. Given this app's real usage pattern — a GM clicking rapidly through HP/condition/AC updates during live, time-pressured combat — this is the finding most likely to actually be felt, especially in encounters with many combatants.

- **Some unmemoized filtering/search work in component bodies, secondary in scale to the above.** `ConditionChips.tsx` (lines 147-158), `IrvMultiSelect.tsx` (line 55), and `AddCombatantDialog.tsx` (line 56) all rebuild filtered option lists directly in the component body on every render, rather than only when the underlying query or options actually change. Given the lists involved (conditions, IRV options, the NPC library) aren't especially large, the per-render cost here is likely modest on its own — worth fixing, but it compounds with the card re-render issue above rather than being a standalone severe problem.

- **Positive finding worth preserving**: where `useMemo` *is* used, it's used correctly. `NpcCard.tsx` and `NpcReferencePanel.tsx` both wrap their `JSON.parse`-based trait/action/reaction/legendary-action parsing in `useMemo` with the correct, narrow dependency (e.g. `[npc.traits]`), not the whole `npc`/`combatant` object. That's the right pattern — it just isn't applied to the card components themselves.

**⚠️ Same caution as the type-safety work (see `CHANGELOG.md`) and the accessibility work above applies here, for a different reason.** Adding memoization incorrectly can introduce *new*, subtler bugs than the ones it fixes — a `useCallback` with a missing or wrong dependency can silently capture a stale value (e.g. an outdated `combatants` array or `id`), which is a correctness bug, not just a performance one, and would be much harder to notice than a TypeScript compile error. If this gets implemented: add `React.memo` and the matching `useCallback`/`useMemo` together as one unit per component, not `React.memo` alone; verify each memoized callback's dependency array is complete and correct (not just "make the warning go away"); and test the specific interaction each memoized component is used for (e.g. HP change, condition toggle) still behaves correctly afterward, not just that the build is clean.

All 4 audit categories have now been directly investigated. Security and type safety have both been fixed (see `CHANGELOG.md` for both). Accessibility is partially fixed — 2 of 3 findings closed (see `CHANGELOG.md`), 1 still open above. Performance was audited directly with real, verified findings recorded above, but is not yet fixed.