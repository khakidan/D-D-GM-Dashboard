# Roadmap

Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

Features and bugs that have been discussed and approved but not yet implemented. Each entry contains enough context to implement without further discussion.

### 🔴 Bugs to Fix

- **`checkAndCaptureToken()` is called redundantly on every mount of any component using `useGoogleAuth`** (confirmed: `App.tsx` calls it once on load; `initGoogleAuth()` — invoked by `useGoogleAuth`, used by both `GMDashboard` and `CampaignSelector` — calls it again independently). Currently harmless only because the OAuth CSRF `state` check (added earlier this session) happens to catch and discard the second, stale attempt every time — but this means the app is relying on that guard to paper over an avoidable duplicate call, not actually preventing the duplicate at its source. Low priority: worth adding a guard (e.g. a module-level "already processed this URL's code" flag) so `initGoogleAuth()` skips re-attempting the exchange if it's already been handled, rather than depending on the CSRF check to quietly absorb the redundant call every time.

### 🟡 Features to Add

None currently.