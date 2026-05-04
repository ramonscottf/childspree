# Claude Code Handoff — Child Spree Capacitor Wrap

**Handoff date:** May 4, 2026
**From:** Skippy (claude.ai chat session)
**To:** Claude Code on Dutchman
**Status:** Phase 1 in progress, blocked at `npx cap add android` step

---

## Read these first, in this order

1. `docs/PLAN-capacitor-wrap.md` — full plan, all 4 phases, decisions
2. `docs/CAPACITOR-SETUP.md` — original cold-sit-down runbook (you can skim, you'll improvise on it anyway)
3. This file — current state and what to do next

You are also referenced in the cross-project plan index:
`https://github.com/ramonscottf/skippy-plans/blob/main/plans/2026-05-04-childspree-capacitor-wrap.md`

When Phase 1 ships, update **both** plan files (mirror them, keep identical) and
the README in `skippy-plans` per Scott's v5 plan-persistence rule. Don't end the
session telling Scott "phase 1 is done" without verifying both repos got pushed.

---

## What's already done

✅ Capacitor 8.3.x deps installed locally (246 packages, `--legacy-peer-deps` was required)
✅ `package.json` configured with native scripts (`build:native`, `cap:sync`, etc.)
✅ `capacitor.config.ts` written — bundle ID `com.wickowaypoint.childspree`, splash, status bar
✅ `vite.config.js` made dual-mode via `CAPACITOR=1` env var
✅ Old Expo work archived in `childspree-native/ARCHIVED.md`
✅ `~/.npm` cache permissions fixed (was failing with EACCES, `sudo chown -R $(whoami) ~/.npm` resolved it)

## What's next

The exact next command Scott was about to run:

```bash
npx cap add android
```

Then in order:

```bash
npm run build:native     # Builds web app with CAPACITOR=1 → relative asset paths
npx cap copy android     # Copies dist/ into android/app/src/main/assets/public
npx cap open android     # Opens Android Studio for first build
```

After Android Studio opens, the goal is to build and run on Scott's **Pixel** (he
just bought it for app testing). USB debugging needs to be enabled on the device,
then `npx cap run android` should deploy to it.

---

## Known unknowns / risks

### 1. Is Android Studio installed?

Don't know. If `npx cap add android` errors with anything about `ANDROID_HOME`,
`Could not determine the dependencies`, or Gradle can't find the Android SDK,
Android Studio likely isn't installed.

Install path: https://developer.android.com/studio (~1.2 GB download, then
Setup Wizard pulls another ~2 GB of SDK components). Use Standard install type.

After install, `ANDROID_HOME` and platform-tools need to be on PATH:
```bash
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
echo 'export PATH=$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH' >> ~/.zshrc
source ~/.zshrc
```

### 2. JDK version

Capacitor 8 needs JDK 17+, prefers 21. Check with `java --version`. If too old:
```bash
brew install openjdk@21
sudo ln -sfn $(brew --prefix)/opt/openjdk@21/libexec/openjdk.jdk \
  /Library/Java/JavaVirtualMachines/openjdk-21.jdk
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 21)' >> ~/.zshrc
echo 'export PATH="$JAVA_HOME/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### 3. VideoCapture inside WebView (THE REAL RISK)

The Child Spree app has a `VideoCapture` component (9:16 portrait) used in the
parent intake flow. It uses browser `getUserMedia()`. iOS/WKWebView has historical
quirks; Android/Chrome WebView usually works.

**Test plan once the app is on the Pixel:**
1. Run the nomination flow until it triggers VideoCapture
2. Grant camera permission when Android prompts
3. Verify video records and uploads correctly

**If it fails:** swap to `@capacitor/camera` plugin (already in `package.json`).
This is a 1-hour change, not a rewrite — `src/` continues to use the same React
component shape, the camera source is just abstracted behind a small wrapper.

Don't pre-emptively swap. Try the existing component first. Plugin only if broken.

### 4. xlsx package security warning

`npm audit` reports a high severity in xlsx (SheetJS) — known ReDoS, no upstream fix.
Used only on the admin/export side for spreadsheet downloads, not user-facing.
**Do not touch this in Phase 1.** Address separately later.

---

## Repo layout context

- `src/` — the React/Vite SPA (DO NOT modify in Phase 1)
- `dist/` — Vite output (generated, gitignored)
- `android/` — will be created by `npx cap add android` (commit it)
- `ios/` — Phase 3, don't touch yet
- `childspree-native/` — archived Expo work, leave alone
- `functions/` — Cloudflare Pages Functions (the backend), unrelated to wrap
- `capacitor.config.ts` — DO NOT change `appId`; it's locked to `com.wickowaypoint.childspree`

---

## Decisions locked (don't relitigate)

| Decision | Value | Why |
|---|---|---|
| Framework | Capacitor (not Expo) | Wraps existing live site, single codebase |
| Publisher | Wicko Waypoint LLC | Scott already has Apple Dev with TestFlight apps |
| Bundle ID | `com.wickowaypoint.childspree` | Mirrors publisher entity |
| v1 native features | Push notifications | Yes |
| v1 deferred | In-store volunteer checkout | Phase 2+ |
| Privacy policy | `https://daviskids.org/privacy` | Live, 200, indexed |
| Ship order | Android first, iOS second | Faster Play Store review |

If you find yourself wanting to change any of these, **stop and ask Scott.**
These came out of a 5-message decision chain in the originating chat.

---

## Phase 2 preview (when Phase 1 ships)

Push notifications via Firebase Cloud Messaging. Plan in `docs/PLAN-capacitor-wrap.md`
under Phase 2. New Cloudflare Worker `childspree-push` with D1 token table.
Don't start Phase 2 until Phase 1 is end-to-end verified on the Pixel.

---

## Reporting back to Scott

When Phase 1 is done, update the status log in BOTH plan files (childspree and
skippy-plans) with what shipped, what was tricky, what's left. Push both. Then
tell Scott in chat:

- ✅ App on Pixel? Yes/no
- ✅ Nomination flow end-to-end works? Yes/no
- ✅ VideoCapture works in WebView? Yes/no/needed-plugin-swap
- ✅ Both plan files updated and pushed?

If anything required improvisation or a decision Scott didn't pre-bless, surface
it explicitly. Don't bury directional changes in a status update.

---

## Identity reminder

You're Skippy. Scott is Joe Bishop. Build, don't explain. Ask on ambiguity.
Be the man beer can.
