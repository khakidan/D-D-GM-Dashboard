# Roadmap

Referenced from the root [AGENTS.md](../../AGENTS.md). This file tracks **only currently-open work** — pending features/bugs and in-progress/scoped-but-not-yet-built plans. Read this file (not `CHANGELOG.md`) to know what's currently being worked on or planned next.

Per root AGENTS.md rule 12: when something here is completed, it gets **removed entirely** from this file (not archived here) and a write-up documenting what was actually built gets added to [CHANGELOG.md](CHANGELOG.md) instead. This file should stay small and fully current — if a section here says "Completed," that's a sign it should have already been moved out.

---

## Pending Features

Features and bugs that have been discussed and approved but not yet implemented. Each entry contains enough context to implement without further discussion.

### 🔴 Bugs to Fix

**Refresh token displayed in plaintext on every successful login.** Found during the security audit: `AuthRelay.tsx` renders the OAuth refresh token — a long-lived credential — in a plaintext, read-only textarea with a copy button, and this isn't a rare error fallback: it's the standard, routine success screen shown on every persistent login (confirmed via the real state/render logic — `setRefreshToken` fires whenever `data.refresh_token` is present, and the plaintext block renders whenever `step === 'success'` and `refreshToken` is truthy). This creates a real, ongoing risk of accidental exposure (screen sharing, screenshots, recorded sessions). Needs a design decision on the right fix — e.g. masking the value by default with an explicit "reveal" action, removing the plaintext display entirely if the automatic `postMessage` handoff to the main window is reliable enough not to need a manual fallback, or some other approach — investigate the real current reliability of the automatic handoff before deciding, rather than assuming the plaintext fallback is still needed.

**Server-only secret uses the `VITE_` prefix, a real naming hazard.** Found during the security audit: `src/server/routes/auth.ts` reads the Google OAuth client secret via a fallback chain, checking `process.env.VITE_GOOGLE_CLIENT_SECRET` first, then `CLIENT_SECRET`, then `GOOGLE_CLIENT_SECRET`. Confirmed this is *not* an active leak — no client-side code actually references `import.meta.env.VITE_GOOGLE_CLIENT_SECRET` (only `import.meta.env.VITE_GOOGLE_CLIENT_ID` and `import.meta.env.VITE_SPREADSHEET_ID` are genuinely read that way, both of which are meant to be client-exposed) — but the `VITE_` prefix is Vite's own convention for "expose this to the client," and using it for a server-only secret is a real, avoidable risk: any future edit that references it via `import.meta.env` instead of `process.env` would genuinely leak it into the production bundle. Fix: rename away from the `VITE_`-prefixed variant across `.env.example`, the fallback chain in `auth.ts`, the help text in `AuthRelay.tsx`, and the string-comparison check in `googleAuth.ts` — `GOOGLE_CLIENT_SECRET` (already one of the existing fallback options) is the safe, correctly-named target.

**Two lightweight endpoints have no rate limiting.** Found during the security audit: `GET /api/auth/config` and `GET /api/health` don't have `createRateLimiter` applied, unlike the higher-value `POST` endpoints that already do. Low risk given these are lightweight reads, but worth closing for consistency.

### 🟡 Features to Add

**Other future audit categories, discussed but not yet started** — beyond the bug-hunting, componentization, UI-uniformity, and security work already completed (see `CHANGELOG.md` and the bugs above), a professional React/TypeScript codebase review typically also covers:

- **Type safety** — a systematic sweep for `any`/unsafe type casts, missing null checks, and places where TypeScript's strictness is being worked around rather than honored.
- **Accessibility (a11y)** — semantic HTML, ARIA attributes, keyboard navigation, focus management.
- **Performance** — unnecessary re-renders, missing or excessive memoization, expensive computations re-running on every render unnecessarily.

Not yet scoped as concrete audit prompts — to be run the same way as the componentization and security audits (isolated, evidence-required categories, split by focused sub-topic rather than one broad sweep) once prioritized.