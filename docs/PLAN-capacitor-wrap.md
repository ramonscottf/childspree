---
title: Child Spree — Capacitor wrap (iOS + Android)
status: spec
project: childspree
phase: Phase 1 — Android wrap (next)
source_chat: "childspree capacitor wrap (May 4 2026)"
created: 2026-05-04
last_updated: 2026-05-04
supersedes: 2026-04-06-childspree-native-expo (phantom row, no file ever committed)
---

# Child Spree — Capacitor wrap (iOS + Android)

## TL;DR

The live React/Vite SPA at `childspree.org` already behaves like a mobile app —
PWA manifest, viewport locked, theme color set, `apple-mobile-web-app-capable`,
hash routing. We wrap it with Capacitor to ship native iOS and Android binaries
to the App Store and Play Store. Single codebase. Same web build, two native
shells.

Phase 1 ships the Android wrap. Phase 2 adds push notifications. Phase 3 adds
the iOS shell (same project, same code). Phase 4 is store submission.

## Decisions locked (May 4 2026)

| Decision | Value |
|---|---|
| Framework | Capacitor (NOT Expo / React Native) |
| Publisher | Wicko Waypoint LLC (faster than DEF D-U-N-S, accepts the optics tradeoff) |
| Bundle ID | `com.wickowaypoint.childspree` |
| Native features in v1 | Push notifications |
| Native features deferred | In-store volunteer checkout flow |
| Privacy policy | `https://daviskids.org/privacy` (live, 200 OK) |
| Privacy ownership note | Wicko publishes on behalf of DEF — may need 1-line addendum on policy or Wicko-side pointer page; resolve at submission |
| Ship order | Android first (faster review), iOS second |

## Why Capacitor, not Expo

The repo already contains a `childspree-native/` directory — an in-progress
Expo / React Native rebuild that a previous Skippy started. ~4,500 lines, 25
files: login, FA portal, admin, intake/video token routes, full nomination form,
VideoCapture component. State and completeness are unknown — no plan was
committed, no README references it.

Scott's call (May 4 2026): **forget Expo, wrap the existing site.** Reasoning:
- The web app is already polished and deployed
- Capacitor wraps it in hours, not weeks
- One codebase to maintain instead of two
- Shipping a working app this season beats shipping a perfect rebuild someday

The Expo work gets **archived in place**, not deleted. Useful reference for
camera/auth patterns if we ever need them.

## What's already in our favor

Inspected `childspree.org/` and `manifest.json` on May 4 2026:

- Vite-built React SPA with hash routing (`/#/`) — Capacitor handles cleanly
- `manifest.json` exists with `display: standalone`, theme color `#1B3A4B`,
  192/512 icons, start URL `/`
- `apple-mobile-web-app-capable=yes` already set
- Viewport locked: `width=device-width, initial-scale=1.0, maximum-scale=1.0`
- No `localStorage` quirks (already an SPA talking to a Worker backend)
- DM Sans + Playfair from Google Fonts — fine in Capacitor (online-only app
  by nature anyway)

The wrap is genuinely "30 minutes of CLI commands plus Apple bureaucracy."

## Risk: VideoCapture inside WebView

The parent intake flow includes the 9:16 portrait `VideoCapture` component.
Browser `getUserMedia` works in Capacitor's WKWebView (iOS) and Chrome WebView
(Android), BUT iOS has historically had quirks around camera permissions
inside web content.

**Mitigation plan:**
1. Phase 1 test: try the existing component as-is in the wrapped Android shell
2. If it works, ship it. If it doesn't, swap to `@capacitor/camera` plugin
   (1-hour change, not a rewrite — same React code, different camera source)
3. iOS gets the same treatment in Phase 3

This is the only known technical risk. Everything else is paperwork.

## Phases

### Phase 1 — Android wrap (~2 hours active work)
- [ ] Install Android Studio on Dutchman (couple-GB download)
- [ ] `npm install @capacitor/core @capacitor/cli @capacitor/android`
- [ ] `npx cap init "Child Spree" com.wickowaypoint.childspree --web-dir=dist`
- [ ] Configure `capacitor.config.json` with theme color, splash, status bar
- [ ] `npx cap add android`
- [ ] `npm run build && npx cap copy android`
- [ ] `npx cap open android` — first build, run in emulator
- [ ] **Verify VideoCapture works in WebView** (the one real risk)
- [ ] Test nomination flow end-to-end on emulator + physical Android device
- [ ] If video fails, swap to `@capacitor/camera` plugin
- [ ] Commit Android shell to repo

### Phase 2 — Push notifications (~3 hours)
- [ ] `npm install @capacitor/push-notifications`
- [ ] Firebase Cloud Messaging project setup (free tier)
  - FCM works for both iOS and Android (Apple's APNs bridges through FCM)
- [ ] New Cloudflare Worker: `childspree-push`
  - D1 table for device tokens (token, platform, user_id, registered_at)
  - `POST /register` — device sends token after permission grant
  - `POST /send` — admin endpoint (Bearer auth) to fire pushes
  - `POST /broadcast` — fan-out to all registered tokens
- [ ] Admin UI in existing Child Spree admin section: "Send notification" button
  with title/body/target audience (all nominators, just selected, etc.)
- [ ] Test loop: install → grant → token in D1 → admin fires → device receives
- [ ] Document for Sherry/Kara: "how to send a push from the admin panel"

### Phase 3 — iOS wrap (~1 hour, after Android proven)
- [ ] `npm install @capacitor/ios`
- [ ] `npx cap add ios`
- [ ] `npx cap copy ios && npx cap open ios`
- [ ] Configure signing in Xcode under Wicko Waypoint LLC dev account
- [ ] Build to physical device via cable, smoke-test
- [ ] Repeat camera test on iOS — fall back to `@capacitor/camera` if needed
- [ ] APNs cert setup in Apple Developer portal, wire to FCM

### Phase 4 — Store submission (~3 hours active, 1-7 days waiting)
- [ ] **Apple Developer enrollment** under Wicko Waypoint LLC ($99/yr)
  - Need Wicko EIN (41-5171763) and bank info
  - Verification 24-48 hr typical
- [ ] **Google Play Console** under Wicko Waypoint LLC ($25 one-time)
  - Verification a few hours to a few days
- [ ] **Icon set generation** — one script takes the 512px and outputs:
  - Apple: 24 sizes (20pt @2x/@3x, 29pt, 40pt, 60pt, 76pt iPad, 1024 marketing)
  - Android: adaptive icon foreground + background, legacy 48/72/96/144/192
- [ ] Splash screens for both platforms
- [ ] **App Store listing**
  - Description, keywords, support URL, marketing URL
  - 5 screenshots minimum (iPhone 6.5" required)
  - Age rating questionnaire (will be 4+ — no objectionable content)
  - Privacy policy URL: `https://daviskids.org/privacy`
  - **Privacy disclosure form** — what data is collected (names, addresses,
    student info — disclose accurately, do not minimize)
  - Reviewer notes: "Nonprofit nomination app for Davis Education Foundation
    back-to-school program. Test credentials available on request."
- [ ] **Play Store listing**
  - Same content, simpler form
  - Data safety section (Google's equivalent of Apple's privacy disclosure)
- [ ] Submit Android first → typically reviewed in hours
- [ ] Submit iOS → typically 1-3 days, sometimes more if reviewer has questions
- [ ] Respond to any reviewer pushback (common: privacy policy ownership
  question — have the Wicko/DEF addendum ready)

## Privacy policy ownership — the Wicko/DEF gap

Apple and Google both verify that the privacy policy applies to the publisher.
The current policy at `daviskids.org/privacy` is owned by Davis Education
Foundation. The publisher will be Wicko Waypoint LLC.

**Options when we hit submission:**

1. **Add 1-line addendum on `daviskids.org/privacy`:** "Child Spree is operated
   by Wicko Waypoint LLC on behalf of Davis Education Foundation. This policy
   governs both entities for purposes of the Child Spree app."
   *Easiest. Recommended.*

2. **Stand up a Wicko-side privacy page** at `wickowaypoint.com/privacy/childspree`
   that re-states the same content and explicitly names both entities.
   *More work, cleaner separation.*

3. **Move to DEF as publisher** if the addendum isn't acceptable to DEF leadership.
   *Adds 1-2 days of D-U-N-S verification, changes nothing else technically.*

Decision deferred to submission step. Either (1) or (2) gets us through review.

## Deferred to v2

- **In-store volunteer checkout flow** — the real native value-add
- Photo upload on shopping day ("here's your kid in their new outfit")
- "Your nomination was selected!" automated push from admin DB triggers
- Offline mode for spotty connectivity at the store
- Volunteer-facing analytics (kids checked in per hour, etc.)

These are what makes the app *more than just the website with an icon*. v1 is
the foundation. v2 is the value.

## What gets archived

The `childspree-native/` directory stays in the repo, untouched. We add a
`childspree-native/ARCHIVED.md` explaining: started as Expo rebuild April 2026,
superseded by Capacitor wrap May 2026, kept for reference (camera + auth
patterns) — not actively maintained, not in CI.

## Status log

- **2026-05-04** — Plan written. Capacitor decision locked. Wicko publisher.
  Push notifications in v1. Privacy policy verified live at daviskids.org/privacy.
  Phase 1 next: install Android Studio on Dutchman, run the wrap.
