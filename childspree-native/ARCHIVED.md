# ARCHIVED — Expo / React Native rebuild (April 2026)

**Status:** Superseded May 4 2026.

This directory contains an in-progress Expo / React Native rebuild of Child Spree
started by a previous Skippy in April 2026. ~4,500 lines across 25 TSX files:
login, FA portal, admin, intake/video token routes, full nomination form,
VideoCapture, auth, i18n, haptics. Built against Expo SDK 54 with EAS build config.

**Why it was superseded:**

Scott's call (May 4 2026) — wrap the existing live Vite/React SPA at `childspree.org`
with Capacitor instead of maintaining two parallel codebases. Capacitor ships
faster, single source of truth, same code on iOS and Android.

Decision context: this directory was started without a written plan committed to
the repo. Scott did not realize it existed when he asked "how close are we to
wrapping the site." The Capacitor wrap was a rediscovery, not a continuation.

**Why this directory still exists:**

Useful reference material, even if we never run `expo start` here again:

- `components/VideoCapture.tsx` (~432 lines) — native camera handling, may inform
  how we approach the WebView camera fallback if `getUserMedia` fails inside
  Capacitor's WKWebView.
- `lib/auth.ts` and `components/AuthProvider.tsx` — token-based auth pattern
  for the FA / admin / volunteer roles, with Expo SecureStore. The Capacitor
  equivalent uses `@capacitor/preferences` or the existing web `localStorage`
  pattern; this directory shows how the role boundaries work.
- `app/intake/[token].tsx` (~493 lines) — the full intake flow with token-based
  deep linking. The web version has its own implementation; this one is a useful
  cross-reference.

**What you should NOT do here:**

- Do not run `npm install` or `expo install` in this directory — it is not in
  the active build path.
- Do not deploy from this directory.
- Do not assume features that exist here also exist in the wrapped Capacitor
  build. Verify against `src/` and `dist/` instead.

**Plan reference:**

- Active plan: `../docs/PLAN-capacitor-wrap.md`
- Cross-project index: `ramonscottf/skippy-plans/plans/2026-05-04-childspree-capacitor-wrap.md`

If at some future point we decide Capacitor is insufficient and a true native
rebuild is justified, this directory is the starting point. Until then, it sleeps.
