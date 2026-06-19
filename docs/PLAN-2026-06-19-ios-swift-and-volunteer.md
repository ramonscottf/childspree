---
title: Child Spree — Native SwiftUI iOS resurrection + Volunteer build-out
status: active
project: childspree
created: 2026-06-19
last_updated: 2026-06-19
supersedes: docs/PLAN-capacitor-wrap.md (Capacitor decision reversed 2026-06-19)
source_chat: "childspree sync + iOS/volunteer scoping (Jun 19 2026)"
---

# Child Spree — Native SwiftUI iOS + Volunteer build-out

## Decision (Jun 19 2026) — REVERSES the May 4 Capacitor decision

- **iOS path: native SwiftUI.** Resurrect branch
  `claude/ios-swift-app-conversion-K60op` (the `ios/ChildSpree/` app). The May 4
  "Capacitor wrap, not native" decision is **superseded** — see
  `docs/PLAN-capacitor-wrap.md` (now marked superseded). The Capacitor `android/`
  shell on `claude/build-capacitor-apk-vTnbC` is parked, not deleted.
- **Volunteer side: build all three** — (a) in-store check-in / QR / shop-day,
  (b) volunteer↔child assignment & matching, (c) bulk comms to volunteers.

## Ground truth as of this session (verified live 2026-06-19)

- **Repo:** `ramonscottf/childspree`, default `main` @ `e2848b7` (2026-05-14).
- **Live:** childspree.org → 200. **Deploy:** CF Pages `childspree`, NOT
  git-connected — manual `npm run build && npx wrangler pages deploy dist
  --project-name=childspree --branch=main`.
- **D1 `5091ef2f-c4bc-4759-872f-1828fde2ec18`** — PRODUCTION data:
  546 nominations, 502 parent_intake, **322 volunteers**. Tables include
  `assignments`, `volunteer_messages`, `gift_cards`, `delivery_confirmations`,
  `fa_phones`, `school_allocations`. `volunteers` has check-in columns
  (`checked_in`, `checked_in_at`, `qr_sent`, `token`, `agreed_to_terms`).

### iOS app — where it actually is

- Lives only on branch `claude/ios-swift-app-conversion-K60op`, dir `ios/`.
  ~46 Swift files. Last commit **2026-04-13**. **54 commits behind `main`.**
  Never merged.
- **Build (XcodeGen, no checked-in .xcodeproj):**
  `brew install xcodegen && cd ios && xcodegen generate && open ChildSpree.xcodeproj`
- **Bundle ID CONFLICT:** Swift spec = `org.daviskids.childspree`
  (project.yml, prefix `org.daviskids`). Capacitor config used
  `com.wickowaypoint.childspree`. **Whatever is in TestFlight has ONE of these —
  confirm in App Store Connect before any rebuild.** MSAL redirect scheme is
  tied to the Swift bundle ID (`msauth.org.daviskids.childspree`).
- `DEVELOPMENT_TEAM` is blank in project.yml → signing set in Xcode at build time.
- **TestFlight reality:** repo has NO committed Xcode project and NO build
  pipeline. Any TestFlight build was archived + uploaded by hand from a locally
  generated project. Source of truth = App Store Connect, not git. This is why
  the files felt "lost": editable source is on the branch; the buildable project
  + upload were local actions.

### THE CRITICAL GAP — resurrection == volunteer build

`ios/.../Networking/Endpoints.swift` (Apr 13) covers: nominations (create/list/
get/patch/remind), intake, upload, portal (login/dashboard/phone/nomination),
fa/video, **volunteers (list/create/patch + bulk message)**, fa advocates, stats,
auth/role.

It is MISSING everything the web grew after April — which is exactly the
volunteer build-out:
- `api/assignments` (+ `[id]`) — volunteer↔child matching
- `api/admin/qr-sheet`, `api/admin/shopday`, `api/admin/allocations` — shop-day/QR
- `api/volunteers/store-counts` — capacity
- `api/giftcards`, `api/delivery/confirm`, `api/receipts/[token]`, `api/shop/[token]`
- `api/nominations/catch-up-video-notifications`, `api/auth/session|logout`

**So: bulk comms already exists in Swift. Check-in/QR/shop-day and
assignment/matching do NOT — porting them IS the iOS volunteer build.**

### Web volunteer side — substantial, verify end-to-end

`main` has `VolunteerForm`, `#/volunteer` route (live), admin **Volunteers** tab,
~64 QR references in App.jsx (5,115 lines), and APIs `volunteers.js`, `[id].js`,
`message.js`, `store-counts.js`, plus `admin/qr-sheet`, `admin/shopday`,
`assignments`. The web is the source of truth; confirm each of the three
volunteer flows works end-to-end on web before porting to Swift.

## Phases

### Phase 0 — Reconcile + recover (this session)
- [x] Sync + ground-truth audit (repo/D1/live/branches).
- [x] Write this plan; mark `PLAN-capacitor-wrap.md` superseded.
- [ ] **Scott:** App Store Connect → TestFlight — confirm which bundle ID/build
      is live and that it's the SwiftUI app. Unblocks all iOS work.

### Phase 1 — iOS recover & rebase (needs a Mac / Claude Code on Dutchman)
- [ ] `xcodegen generate`, build to iOS 16 simulator against live API.
- [ ] Smoke-test every existing screen vs current web behavior; log what broke
      in 54 commits of API drift.
- [ ] Decide bundle ID of record; align MSAL redirect + App Store Connect.

### Phase 2 — Volunteer features (web verify → Swift port)
- [ ] 2a Check-in / QR / shop-day: verify web flow end-to-end, then add Swift
      endpoints + screens.
- [ ] 2b Assignment / matching: verify `assignments` API + web UI, then Swift.
- [ ] 2c Bulk comms: Swift already has `messageVolunteers`; verify web
      `message.js` + `volunteer_messages`, wire the Swift admin screen.

### Phase 3 — iOS TestFlight refresh
- [ ] Sign under correct team, archive, upload, supersede old build.

### Phase 4 — Store submission (deferred)
- Privacy-policy ownership (Wicko vs DEF) per superseded Capacitor plan; reuse
  that analysis.

## Open questions
- Bundle ID of record: `org.daviskids.childspree` (Swift) vs
  `com.wickowaypoint.childspree` (Capacitor)? Publisher = Wicko or DEF?
- Is there a web-side gap too, or is iOS the only thing behind?

## Status log
- **2026-06-19** — Sync session. iOS path switched back to native SwiftUI;
  volunteer build-out scoped to all three flows. Capacitor plan superseded.
  Key finding: SwiftUI app is 54 commits behind and missing the entire
  shop-day/QR/assignment layer — iOS resurrection and volunteer build are one
  effort. Plan persisted; stale Capacitor doc reconciled.
