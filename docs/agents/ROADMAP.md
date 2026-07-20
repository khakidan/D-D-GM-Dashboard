# Roadmap

Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

Features and bugs that have been discussed and approved but not yet implemented. Each entry contains enough context to implement without further discussion.

### 🔴 Bugs to Fix

**Combat log silently failed to start despite following the expected flow — logging needs to be much more robust.** Dan followed what should be the standard sequence (Call for Initiative → set initiative scores → Next Turn → played the full encounter), then got a message at End Combat saying the encounter wasn't logged because it "wasn't properly started" — losing the entire session's combat log with no warning until it was already too late to recover. Reported from tonight's game session (2026-07-18).

**Design direction (Dan's, refined): a dedicated Record/End Encounter button.** Rather than logging starting as an implicit side effect of some other action, give it one single, explicit, unmissable trigger. This reuses the existing "End Encounter" button's slot in the combat toolbar (currently positioned between "Roll NPC Init" and "Cancel Encounter" — confirmed against a screenshot of the real current toolbar) rather than adding a new button. That one button gets 3 explicit states:

1. **Before pressed**: labeled "Record Encounter" — logging has not started yet.
2. **After pressed**: relabels itself "End Encounter," with a small red dot beside the text that gently pulses (fades in/out) for the rest of the fight — this pulsing dot *is* the recording-status indicator, so no separate one is needed.
3. **Clicking "End Encounter"** finalizes the log as complete (same semantics as the current "End Encounter"/`onResetCombat` action).

"Cancel Encounter" is unaffected and should keep its existing behavior — a full short-circuit that discards the encounter and any log accumulated for it (the current confirmation dialog already warns "the combat log will be discarded and this cannot be undone").

**Root cause investigation is complete — 3 distinct real failure modes were found, not one.**
1. **"Call for Initiative" skipped entirely.** `initCombatLog(...)` is currently only ever called from `handleCallInitiative` in `useCombatLifecycle.ts`. If a GM sets initiative manually and goes straight to "Next Turn" without clicking that button, no log is ever created.
2. **Silent cross-tab overwrite.** The cross-tab `storage` event listener in `dashboardStore.ts` compares and merges `activeCombatLog` independently from the rest of `combatState`'s redundancy guard, with no logic to prefer a real log over an incoming `null`. Any other open tab (a stray Player View tab, a second GM tab) with a stale/uninitialized `activeCombatLog` doing anything that triggers a state save can silently wipe the primary tab's real, in-progress log — confirmed directly against the real code.
3. **Multi-device / cleared-storage resume.** `activeCombatLog` lives only in `localStorage`, never written to the sheet until "End Encounter." `useEncounterResume.ts` correctly restores everything else (round, active turn, combatants) from the sheet on a new device or after storage is cleared, but has no way to restore the log itself, since nothing was ever saved for it to restore from. Everything visually looks fully resumed while the log stays silently empty underneath.

**The fix is a genuine architecture change, not a small patch: progressive, per-event logging directly to Google Sheets, with a durable, sheet-based "is this encounter recording" flag.** This solves all 3 failure modes at once (the button design above already solves #1) — moving the combat log's source of truth from a fragile client-side blob to the same sheet-as-SSOT pattern already used for everything else in this app.

**Design, fully settled after extensive review — not to be re-litigated during implementation:**
- A new sheet tab, `EncounterLogEvents`, with one row per individual combat event (not the current single JSON-blob-per-encounter approach), written via Google Sheets' real `values.append` operation — genuinely atomic, no read-modify-write race condition.
- A new `Logging_Requested` column (8th column) on the existing `Encounters` sheet — the durable, sheet-based gatekeeper for whether an encounter is currently recording. Set to `TRUE` **only** when the GM explicitly clicks "Record Encounter" — never automatically from opening, resuming, or viewing an encounter, and "Call for Initiative" plays no role in triggering it either. This was confirmed explicitly to eliminate the exact ambiguity that caused the original bug.
- `addCombatEvent` (the existing, synchronous Zustand store action) stays pure and unchanged in its core contract, except that it must preserve an already-provided `id`/`timestamp` on the incoming event rather than always generating its own — this was a real bug caught during design review (see below).
- A new `logProgressiveEvent` async action wraps `addCombatEvent`: generates the event's `id`/`timestamp` once, commits it locally via `addCombatEvent`, then separately fires the network write to `EncounterLogEvents` if `loggingRequested` is true. Every real caller of `addCombatEvent` across the hooks (`useHealthChange.ts`, `useCombatTurn.ts`, `useDeathSaves.ts`, `useCombatantExpanded.ts`, `useCombatantMutations.ts`, `useCombatLifecycle.ts`) needs to be switched to call this instead. This separation was specifically chosen over baking the network call directly into `addCombatEvent`, to keep the pure state action mock-free and testable.
- **"End Encounter" must build its final summary by freshly fetching all `EncounterLogEvents` rows for the encounter from the sheet — never from local state.** Building it from local state would silently reintroduce the exact same fragility this whole redesign exists to fix. The compiled summary still gets written to the existing `EncounterLogs` sheet in the exact same schema/format as today, so `EncounterLogModal.tsx`, `EncounterLogDetails.tsx`, and the rest of the existing log-viewing workflow need zero changes.
- "Cancel Encounter" sets `Logging_Requested` back to `false` with no summary written, consistent with its existing discard-everything behavior.

**A real bug was caught during design review and must not be reintroduced during implementation**: an early draft of `logProgressiveEvent` generated its own `id`/`timestamp`, but the existing `addCombatEvent` implementation unconditionally overwrites `id`/`timestamp` with fresh values regardless of what's passed in — meaning the same logical event would end up with 2 different identities in local state vs. the sheet. The fix is `addCombatEvent` using `event.id || generateCombatEventId()` (and the equivalent for `timestamp`) so a pre-supplied identity is preserved rather than discarded.

**Staged implementation plan (6 stages, each a separate, tightly-scoped prompt):**
1. **Schema & types** — `ENCOUNTER_LOG_EVENT_HEADERS`, the new `Logging_Requested` column on `ENCOUNTER_HEADERS`, updating `SHEET_RANGES.encounters` (currently `'Encounters!A2:G'`, a 7-column range — must be widened or the new column exists but is never read), the `Encounter` type, `sheetAdapters.ts`'s row-mapping, and the campaign-creation route so **new campaigns automatically provision both** when their spreadsheet is created.
2. **DB operations layer** — functions to append a single event row, toggle `Logging_Requested`, and fetch all events for a given `encounterId`.
3. **Store/hook layer** — the `addCombatEvent`/`logProgressiveEvent` split (with the id/timestamp fix above), and switching every real caller across the hooks to the new progressive-write path.
4. **Record/End Encounter button UI** — the actual 3-state button wired to the real trigger and fetch-and-compile logic.
5. **Tests** — real coverage added at each stage as it's built.
6. **Documentation** — `schema.md` updated by Claude directly once the real, implemented schema is confirmed (not delegated to AI Studio, consistent with how this file and `CHANGELOG.md` are maintained).

**Manual spreadsheet update still needed from Dan.** Dan will need to manually add the new `EncounterLogEvents` tab and the `Logging_Requested` column to his existing production spreadsheet, since he's not maintaining old encounters and prefers to edit it directly rather than have this automated for existing campaigns. The exact, final column names/order will be given to him once Stage 1 is implemented and verified against the real code — not before, since a detail could still shift during implementation.

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