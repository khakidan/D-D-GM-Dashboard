# Roadmap
Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

### 🔴 Bugs to Fix

- **CRITICAL SECURITY BUG — `src/services/googleAuth.ts`'s `postMessage` origin check is completely inert.** Discovered during the Round 2 modularity re-audit (see `CHANGELOG.md`). In the `window.addEventListener('message', ...)` handler (~line 328), the origin comparison reads `origin === window.location.origin` — but `origin` is never declared in scope; the callback's parameter is `event`, and the correct property is `event.origin`. Bare `origin` resolves to the browser's global `window.origin` (the *receiving* page's own origin), so the check evaluates true unconditionally on every `message` event regardless of sender. This means the `ALLOWED_ORIGINS`/localhost checks never run and the `if (!isAllowed) return;` guard never fires — **any window, iframe, or opener can post an `OAUTH_REDIRECT_PAYLOAD` message and have this app call `checkAndCaptureToken()` on an attacker-supplied URL.** Fix is NOT included in this entry — needs its own careful, explicitly-reviewed implementation cycle (likely `origin` → `event.origin` on 3 lines) with real before/after security-behavior verification. High priority — live vulnerability in production auth code.
- **`combatLogic.ts`'s `computeDamageWithIrv()` does not correctly handle a combatant with BOTH resistance AND vulnerability to the same damage type.** Discovered during the Round 2 modularity re-audit (see `CHANGELOG.md`). RAW 5e (2014) rules say both should apply (halve, then double — nets to the original amount). The code's sequential `if`/`else if` returns on the resistance match before vulnerability is ever checked, so an overlap is treated as merely resistant (half damage) instead of the correct full amount. Low-to-medium severity — standard stat blocks rarely have this overlap; matters mainly for homebrew content or a resistant PC hit by a vulnerability effect. No test currently covers this case. Fix: compute both matches; if both apply, net them out per RAW (return `baseDamage` with an appropriate combined label) — plus a new regression test.
- **`checkAndCaptureToken()` is called redundantly on every mount of any component using `useGoogleAuth`** (`App.tsx` calls it once on load; `initGoogleAuth()`, used by both `GMDashboard` and `CampaignSelector`, calls it again independently). Currently harmless only because the OAuth CSRF `state` check discards the second, stale attempt every time. Low priority: add a module-level "already processed this URL's code" flag so `initGoogleAuth()` skips re-attempting the exchange if already handled.

### 🟡 Features to Add / Test Coverage Gaps

- **`CampaignSelector.tsx` has thin test coverage.** Existing `CampaignSelector.test.tsx` (4 tests) only covers static render states. Zero coverage for: expanding/submitting either form, validation-failure paths, or the inline delete-confirmation lifecycle. Worth a dedicated pass given this is the first screen every user sees. Follow the seam-test standard — assert on actual `onCreateCampaign`/`onConnectCampaign`/`onDeleteCampaign` call arguments.
- **`sheetsService.ts`'s `googleFetch` retry/backoff engine has zero dedicated test coverage.** No test exercises the 401→refresh→retry-once path, the 429/5xx exponential-backoff-with-jitter loop, or the `MAX_RETRIES` boundary. Given `googleAuth.ts` just turned up an undetected security regression specifically because a similar path had no test, this is worth prioritizing.
- **Tiny doc-precision fix, `dashboardStore.ts`'s `getSnapshot()` comment.** Harmless (confirmed zero live bugs), but the comment claims to "return only the AppState fields, not the store methods" while also silently excluding `activeCombatLog` (real state, not a method). Recommended: `// Return only the core Sheets-synchronized AppState-shaped fields. // Note: Extended state like activeCombatLog and store methods are excluded. // Call useDashboardStore.getState() directly if the combat log is needed.`
- **`ResourcePoolsSection.tsx`'s `PipTracker` doesn't respect `isSyncing`** the way the adjacent `-`/`+` buttons do (`disabled={... || isSyncing}`). Doesn't corrupt data, but is a real UX inconsistency — add `readOnly={isSyncing}` to the `PipTracker` call.
- **`ResourcePoolsSection.tsx` has no dedicated test file** — coverage is indirect only via `useCombatantExpanded.test.ts`'s integration tests; the UI layer itself (form toggles, inline edit, pip interactions) is untested.
- **Cross-file Traits/Actions/Reactions/Legendary-Actions render-prop wiring is duplicated across `CharacterCardExpanded.tsx`, `NewPlayerDialog.tsx`, and `NpcCard.tsx`.** `renderTraitFields`/`renderReactionFields` are byte-identical across all 3; `renderActionFields`/`renderLegendaryActionFields` differ only by a per-file `idPrefix` string. Mirrors the exact situation that led to this codebase's `NpcSimpleFieldEditor.tsx`/`NpcCombatActionFields.tsx` extraction. Worth a dedicated investigation into a small shared factory/hook (e.g. `createNpcListRenderers(idPrefix)`).
- **`NpcCard.tsx`'s Legendary Actions tests don't directly assert name-field editing** — only initial render, cost-editing, and add/remove are directly tested. Low priority; the underlying wiring was separately confirmed correct by direct code inspection.

---

## Refactor Candidates — Codebase Modularity Audit (Round 2)

The full audit (every file individually re-verified, including everything confirmed correctly-not-flagged) is documented in `CHANGELOG.md`. The 4 genuine candidates below are still open/unimplemented.

### Candidate 1 — `src/components/CommandPalette.tsx` (607 lines) — scope corrected, not yet decided whether worth doing

Original "command dispatch layer" premise didn't hold up (see `CHANGELOG.md`). Only 3 functions 
(`testDeathAnimation`/`testDamageAnimation`/`testHealAnimation`) are genuinely extractable; everything 
else is trivial inline dispatch next to its own menu item. The real problem is repetitive JSX 
markup (~25 near-identical `Command.Item` blocks), not tangled logic. A markup-deduplication refactor 
(a small render-helper or data-driven `.map()`) would be a different, smaller-scoped fix than 
originally proposed — not yet decided if it's worth doing given the modest real payoff either way.

### Candidate 2 — `src/lib/conditionDefinitions.ts` (766 lines) — genuine split warranted

498 lines (65%) of static `CONDITION_MECHANICS` data vs. 247 lines (32%) of real branching logic 
across `buildConditionSummary`/`applyLongRestToConditions`. Proposed: extract the data + interface 
into `src/lib/conditionMechanicsData.ts`; leave the 2 functions in a lean ~250-line 
`conditionDefinitions.ts`. **Not a zero-file-touch change**: `src/lib/concentrationCheck.ts` imports 
`CONDITION_MECHANICS` directly, bypassing the `conditions/index.ts` barrel — its import path must be 
updated, or `CONDITION_MECHANICS` re-exported from `conditionDefinitions.ts` for backward compat (a 
design choice to make explicitly before implementing). Every other consumer goes through the barrel 
and needs no changes. Verification requirement: raw `tsc` output + Batch 1 (both dedicated test files, 
24+5 tests) + every batch covering the 7 real downstream consumers.

### Candidate 3 — `src/components/AudioLibrary.tsx` (546 lines) — split warranted, test coverage must come first

5 genuine responsibility clusters (upload/drag-drop, playback preview, mood-assignment popover, 
cascading delete/localStorage sync, tab-switching). Proposed split into `MoodAssignmentPopover.tsx`, 
`AudioFileRow.tsx` (does NOT own preview state — `previewingFileId`/`previewAudioRef`/
`previewTimerRef` must stay lifted in the parent for the single-preview-at-a-time guarantee), and 
`AudioLibraryDropzone.tsx`. Extracting `AudioFileRow.tsx` does NOT automatically prevent re-renders — 
that requires a separate `React.memo` + `useCallback` step. **⚠️ Non-negotiable sequencing**: 
`AudioLibrary.test.tsx` has only 2 tests; coverage (successful upload, delete-confirmation lifecycle, 
single-preview enforcement) must be substantially expanded FIRST, verified via Batch 7B-1, before any 
structural extraction begins.

### Candidate 4 — `src/components/ui/ConditionChips.tsx` (503 lines) — split warranted, test coverage must come first

Mixes floating-portal positioning/scroll/outside-click plumbing (~150 lines) + inline duration-prompt 
UI (~35 lines) with real D&D 5e rule automation (immunity blocking, exhaustion-6 death, concentration 
cascade) — the automation orchestration must stay in the coordinator. Proposed: extract 
`ConditionSearchDropdown.tsx` and `ConditionDurationPrompt.tsx` as pure presentational components — 
confirmed the dropdown does NOT need the parent's `wrapperRef` passed down; keep `open` state and 
scroll/outside-click listeners lifted in the parent, pass the dropdown only `isOpen`/`style`/results/
`onSelect`. **⚠️ Non-negotiable sequencing**: zero dedicated test coverage exists at all — this is the 
highest-stakes file in the whole audit (exhaustion-death, concentration-breaking automation). Tests 
must be added FIRST (debounced `onChange`, immunity-blocked rejection, exhaustion-tier replacement, 
exhaustion-6 death callback, incapacitation breaking concentration, manual "Concentrating" removal 
cascade, duration-timer confirm/skip), added to Batch 8, verified before any structural change.

---

## Working Discipline — Lessons Baked Into This Project (read before starting any new work)

1. **Never accept a "tests passed" or "verified" claim without literal, pasted, raw terminal output.**
2. **Never expand scope beyond what was explicitly requested in the current step.**
3. **Any "verbatim" or "raw" quote of a file must be independently checked against the real file before being trusted.** The `NpcCard.tsx` investigation (see `CHANGELOG.md`) is a live example: a suspected prop-mismatch bug turned out to be a transcription artifact from an earlier paste, caught only by re-verifying against the real file.
4. **Investigate before proposing a fix — especially for anything touching shared state, rollback logic, or cross-component data flow.** The same principle applies to refactor *candidates*: an initial "this file is cohesive" judgment isn't trustworthy until independently re-verified line-by-line (see the Round 2 audit in `CHANGELOG.md`).
5. **When a redesign or consolidation has already happened to a file, check `CHANGELOG.md` for it before touching that file again.**
6. **When a refactor candidate's investigation reveals thin or nonexistent test coverage, treat expanding that coverage as a mandatory prerequisite stage, not an optional nice-to-have.**
7. **A file being reviewed for one reason doesn't mean it should only be checked for that reason.** The `googleAuth.ts` and `combatLogic.ts` bugs above were both found only because a file was being read closely enough to verify a structural claim — watch for correctness issues too, always.