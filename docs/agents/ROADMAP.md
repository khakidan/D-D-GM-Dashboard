# Roadmap

Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

Features and bugs that have been discussed and approved but not yet implemented. Each entry contains enough context to implement without further discussion.

### 🔴 Bugs to Fix

- **Encounter logging state doesn't resume correctly after leaving and re-entering an in-progress encounter.** Root-caused via direct investigation (not yet implemented). Two distinct parts:

  - **Part A — sync range truncation.** `src/hooks/useSheetSync.ts` fetches the Encounters sheet with a hardcoded, truncated range (`'Encounters!A2:G'`), omitting column H (`Logging_Requested`) entirely. `src/lib/constants.ts`'s `SHEET_RANGES.encounters` already correctly defines `'Encounters!A2:H'`, but `useSheetSync.ts` doesn't use it. Confirmed via full-codebase grep: this is the *only* place fetching the full Encounters sheet with a truncated range — no other file has the same mistake. As a result, `loggingRequested` is always parsed as `false` on every sync, regardless of the sheet's real value, and the UI shows "Record Encounter" instead of "End Encounter" even when logging is genuinely active on the sheet.

  - **Part B — transient state not reconstructed on resume.** Even once Part A is fixed, `src/hooks/useEncounterResume.ts`'s auto-resume effect (triggered when `state.hasInitialSynced` transitions to `true`) restores `combatState.combatants`/`activeTurnId`/`round` from the freshly-synced sheet data, but never reconstructs the in-memory `activeCombatLog` store state. `activeCombatLog` is transient — only ever held in Zustand memory, never persisted to the sheet — so a resumed session with `loggingRequested: true` has no active log object. Confirmed: this means further combat events would fail to log during the resumed session, and "End Encounter" would find no `activeCombatLog` to work from.

  - **Verified design decisions:**
    - The snapshot-building logic already exists inline inside `ensureCombatLogInitialized` (in `useCombatLifecycle.ts`) — rather than duplicating it, it's being extracted into a new shared, pure function, `buildPartySnapshot()`, in `src/lib/combatLog.ts`. Both `useCombatLifecycle.ts` and the new resume logic in `useEncounterResume.ts` will call this one shared function.
    - `buildPartySnapshot()` takes a small, self-contained structural input type (`SnapshotCombatantInput`), not the real `Combatant` type from `types.ts` — confirmed via direct verbatim source check that `types.ts` (line 2) already imports `ActionType` from `lib/combatLog.ts`, so importing `Combatant` back from `types.ts` into `combatLog.ts` would create a real circular dependency (`types.ts` → `combatLog.ts` → `types.ts`). The structural-typing approach avoids this while still accepting real `Combatant[]` arrays at both call sites with no manual remapping needed, since `Combatant` structurally satisfies `SnapshotCombatantInput`.
    - `buildPartySnapshot()`'s `cr` field passes `challengeRating` through unchanged (`cr: c.challengeRating ?? undefined`) — an earlier draft incorrectly tried to convert it to a number via `parseFloat`, which would have silently corrupted fractional CRs like `"1/4"` (`parseFloat("1/4")` evaluates to `1`, not `0.25`). Confirmed the corrected version matches the original, already-correct logic in `ensureCombatLogInitialized`, and confirmed via TypeScript's ternary literal-narrowing behavior that the `type` field (`'pc' | 'npc'`) type-checks cleanly even though the input's `type` field is the looser `string`.
    - In `useEncounterResume.ts`, the new resume logic builds the snapshot from the locally-rebuilt `rebuiltCombatants` array — **not** via `getSnapshot()`/the store — since `combatState.combatants` hasn't committed to the Zustand store yet at the exact point in the resume effect where this logic runs. Calling `getSnapshot()` there would read a stale, empty/outdated combatants array.
    - The resume logic deliberately does **not** re-fire the `combat-start` progressive event — that event was already logged once when the encounter was originally started via "Record Encounter" or "Call for Initiative"; re-firing it on resume would create a duplicate `combat-start` entry in the final transcript.
    - **Known, accepted limitation**: resuming initializes the log with `events: []`, meaning the live in-session Combat Log panel won't show events logged before the page reload/re-entry. This is acceptable because the durable record in the `EncounterLogEvents` sheet is unaffected, and "End Encounter" already re-fetches the complete event history fresh from that sheet (via `fetchEncounterLogEventsDB`) regardless of what the transient in-memory log contains.

  - **Files to be changed**: `src/hooks/useSheetSync.ts` (range fix), `src/lib/combatLog.ts` (new `buildPartySnapshot` export), `src/components/ActiveEncounterTab/hooks/useCombatLifecycle.ts` (use the shared function instead of its inline duplicate), `src/hooks/useEncounterResume.ts` (new resume-time log reconstruction logic).

### 🟡 Features to Add

**Other future audit categories:**

None currently open. Security, type safety, accessibility, and performance have all been directly investigated and fixed (see `CHANGELOG.md`) — the last open performance item (the `useCombatantCard`/`useCombatantExpanded` leaf-component store-access exception) was resolved by fully threading `isActiveTurn`/`isSelected`/`isSelectable`/`isSyncing` and the combatant-mutation functions down as props from `ActiveEncounterTab/index.tsx`, closing the gap `patterns.md` previously documented as a deliberate, temporary exception.