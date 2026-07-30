# Roadmap
Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

### 🔴 Bugs to Fix

None.

### 🟡 Features to Add / Test Coverage Gaps

None.

### 🟡 Codebase-Wide Quality Audits (Persistence + Test Quality)

Two related, staged audits triggered by finding two real, silent
persistence gaps this session (`autoRefreshMechanics`, then PC
`speed`/`senses`/`languages`) — both were fields wired into a TypeScript
interface and the UI's `onChange`/`onUpdate` calls, but never actually
reaching the Google Sheet (missing from the sheet schema, the write
path, and/or the read path). Given this pattern already occurred twice
undetected, the working assumption for Part 1 is that more instances of
it likely exist elsewhere in the codebase and need to be found
systematically, not assumed away.

**Both audits proceed one folder at a time, matching `file-reference.md`'s
own folder structure exactly.** This is deliberate: earlier attempts at
larger, multi-part single prompts in this project produced contradictory
or incomplete results and had to be redone. Each folder gets its own
investigation-only prompt, its own complete report, and its own review
before moving to the next — no folder is skipped, combined with another,
or summarized without showing the underlying field-by-field or
test-by-test trace behind the conclusion. A summary verdict with no shown
work (e.g. "all fields match, no gaps found") is not acceptable on its
own — every claim must be traceable to quoted, real code.

---

#### Part 1 — Persistence Audit

**Goal:** produce a complete inventory of every user-enterable field
anywhere in the app (excluding Audio, which is intentionally
IndexedDB/localStorage-only per `schema.md`), and for each one,
definitively state whether it persists to the Google Sheet end-to-end
(schema column exists AND write path includes it AND read path maps it
back), or is a phantom field (UI/TypeScript-only, silently lost on
sync — the same shape of bug as the two already found and fixed).

**Folder sequence (one investigation-only prompt per folder, in this order):**
1. `src/components/PartyTab/` — Character fields (IN PROGRESS)
2. `src/components/NpcLibraryTab/` — NPC fields
3. `src/components/EncountersTab/` — Encounter fields
4. `src/components/ActiveEncounterTab/` — Combatant/EncounterCombatant
   per-instance state
5. Settings (`SheetConnectionSettings.tsx`, `AuthPortalSettings.tsx`,
   `src/components/auth/`) — confirming which fields are legitimately
   localStorage-only per `schema.md`'s Storage Rules vs. which should
   persist to the sheet but don't

**Per-folder methodology (repeated identically for each folder):**
- List every UI input calling an onChange/onUpdate/onSave handler, with
  the exact field name written.
- Trace each field to its TypeScript interface property (`Character`,
  `NPC`, `Combatant`, `Encounter`, `EncounterCombatant`, etc.).
- Cross-reference against the REAL, current `*_HEADERS` arrays in
  `sheetSchemas.ts` (quoted fresh from disk each time, never assumed
  from memory of a prior pass).
- For fields present in headers: confirm write path (`dbOperations`
  add*/update* row arrays) AND read path (`sheetAdapters.ts` map*
  functions) both include it — a field in headers but missing from
  either path is still a real gap.
- Nested sub-fields inside Traits/Actions/Reactions/Bonus Actions/
  Legendary Actions list editors (attackBonus, damage, damageComponents,
  saveDC, saveType, dcAbilities, atkAbility, range, recharge, cost, etc.)
  each get their own persistence confirmation — not just the parent
  list's JSON blob.

**Report format per field** (no exceptions — a folder's report is not
complete without this level of granularity for every field found):
FIELD: <name>
UI LOCATION: <file, component>
INTERFACE: <Type>.<propertyName>
HEADERS: present at index N / ABSENT
WRITE PATH: confirmed in <file>:<function> / ABSENT
READ PATH: confirmed in <file>:<function> / ABSENT
STATUS: ✅ Fully persisted / ⚠️ Partial gap / ❌ Phantom field

Once all 5 folders are reported, gaps get compiled into a single sorted
list and scoped into fix stages (same pattern already used for the
`autoRefreshMechanics`/`speed`/`senses`/`languages` fixes: investigate →
project owner adds any needed sheet columns manually → implementation
prompt → verified raw test output → doc sync).

---

#### Part 2 — Test Quality Audit (against `testing-philosophy.md`)

Completed.

---

##### Implementation discipline (applies to both parts)
- One folder per prompt. Never combine folders to save time.
- Every conclusion must be traceable to quoted, real code read fresh
  from disk in that same response — not carried over from memory of an
  earlier pass, and not asserted without showing the underlying trace.
- A response that only delivers a summary/conclusion without the
  required per-field or per-file granularity is incomplete and must be
  redone in full, not accepted partially.
- Findings from Part 1 get compiled into fix-stage prompts only after
  all 5 folders are reported. Findings from Part 2 get fixed
  incrementally, per file, as each folder's audit completes — not
  batched into one giant fix pass at the end.

---

## Working Discipline — Lessons Baked Into This Project (read before starting any new work)

1. **Never accept a "tests passed" or "verified" claim without literal, pasted, raw terminal output.**
2. **Never expand scope beyond what was explicitly requested in the current step.**
3. **Any "verbatim" or "raw" quote of a file must be independently checked against the real file before being trusted.** The `NpcCard.tsx` investigation (see `CHANGELOG.md`) is a live example: a suspected prop-mismatch bug turned out to be a transcription artifact from an earlier paste, caught only by re-verifying against the real file.
4. **Investigate before proposing a fix — especially for anything touching shared state, rollback logic, or cross-component data flow.** The same principle applies to refactor *candidates*: an initial "this file is cohesive" judgment isn't trustworthy until independently re-verified line-by-line (see the Round 2 audit in `CHANGELOG.md`).
5. **When a redesign or consolidation has already happened to a file, check `CHANGELOG.md` for it before touching that file again.**
6. **When a refactor candidate's investigation reveals thin or nonexistent test coverage, treat expanding that coverage as a mandatory prerequisite stage, not an optional nice-to-have.**
7. **A file being reviewed for one reason doesn't mean it should only be checked for that reason.** The `googleAuth.ts` and `combatLogic.ts` bugs above were both found only because a file was being read closely enough to verify a structural claim — watch for correctness issues too, always.
8. **A "no explicit migration needed" claim for a schema change must be verified on BOTH the read side and the write side before being trusted** — the Bonus Actions scoping above is the model: `padRow()`/`stringDefault()` were confirmed to handle short legacy rows on read, and the row-construction functions were separately confirmed to always emit full-length rows on write, rather than assuming one side's safety implies the other's.