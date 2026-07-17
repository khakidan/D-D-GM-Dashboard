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

**"Code smells beyond duplication" — investigated, 1 real finding remains:**

- **Magic numbers**: a `TIMERS` constants object already exists and is the established pattern, but 6 `setTimeout` calls bypass it with raw literals instead — `AuthRelay.tsx` (2000ms), `EncounterLogDetails.tsx` (2000ms — same value and same "copied" feedback purpose as `AuthRelay.tsx`), `EncounterCard.tsx` (3000ms), `useCombatSync.ts` (5000ms), `AnimatedHpDisplay.tsx` (500ms), `useSheetSync.ts` (800ms). `AuthRelay.tsx` notably uses `TIMERS.authRelayPollingMs` correctly on one line and a raw `2000` twenty-three lines later — an inconsistency within the same file.

Deeply nested conditionals were also investigated directly and ruled out — no real finding there; the apparent nesting was JSX conditional rendering and callback structure, not tangled branching logic.

**Adjacent finding, technically duplication rather than a new category**: `useCombatTurn.ts` still uses raw `.split(',').map(s => s.trim())...` condition-parsing — the exact pattern `parseCommaSeparatedList()` was built to replace earlier this session. (`useCombatantMutations.ts`'s instances of this same gap were fixed as part of its `updateCombatant` god-function decomposition — see `CHANGELOG.md`.)

**"Error handling consistency" — investigated, real findings ready to act on.** 3 genuinely different patterns are in use for surfacing client-side async failures to the GM: `toast.error(...)` (the documented canonical pattern), local state rendered inline in the UI (also legitimate — confirmed genuinely wired through in `useCampaign.ts` → `CampaignSelector.tsx`, `useEncounterLogs.ts` → `EncounterLogModal.tsx`, and `useSheetSync.ts`'s `syncError` → `SyncingOverlay.tsx`/`SyncStatusIndicators.tsx`), and — the real problem — **console-only, genuinely silent**, confirmed in 11 places:

- `AudioLibrary.tsx:116` — preview playback setup failure (recovers via `stopPreview()`, but no message)
- `AudioLibrary.tsx:156` — cascading sound-removal layout update failure
- `EncountersTab.tsx:40` — loading encounter logs for the "completed" check
- `Soundboard.tsx:82` — playing a sound effect from a slot
- `useMoodPresets.ts:32` — loading mood presets from localStorage
- `useAudioEngine.ts:214` — ambient audio failing to start
- `useAudioEngine.ts:352` — decoding sound-effect audio data
- `dashboardStore.ts:274` — cross-tab sync (BroadcastChannel/storage event)
- `useCampaign.ts:40` — parsing saved campaigns from localStorage
- `combatantBuilder.ts:206` — parsing an NPC's recharge-state JSON (synchronous, not async, but the same silent pattern)
- `dbOperations/encounters.ts`'s `deleteEncounterFully` — the most consequential one: an inner catch swallows a failure while cleaning up `EncounterLogs` rows during encounter deletion, and the outer function proceeds with the main deletion regardless, leaving orphaned log rows with no indication to the GM that cleanup didn't finish

The service layer (`dbOperations/*.ts`, `sheetsService.ts`, `googleAuth.ts`) is otherwise almost perfectly consistent — 25 of 26 catch blocks there correctly log-and-rethrow, leaving the UI decision to the calling hook; the `deleteEncounterFully` case above is the one exception. Not yet fixed.

**Other future audit categories, discussed but not yet started** — beyond bug-hunting, componentization, and the findings above, a professional React/TypeScript codebase review typically also covers:

- **Type safety** — a systematic sweep for `any`/unsafe type casts, missing null checks, and places where TypeScript's strictness is being worked around rather than honored.
- **Accessibility (a11y)** — semantic HTML, ARIA attributes, keyboard navigation, focus management.
- **Security** — this app handles real OAuth tokens and writes to a GM's actual Google Sheets. Worth checking `dangerouslySetInnerHTML` usage, how tokens are stored/read, and injection risk from user-generated content (NPC names, notes, etc.) rendered without sanitization.
- **Performance** — unnecessary re-renders, missing or excessive memoization, expensive computations re-running on every render unnecessarily.

Not yet scoped as concrete audit prompts — to be run the same way as the componentization audit (isolated, evidence-required categories) once prioritized.