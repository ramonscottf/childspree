# Claude Code Handoff — Child Spree Capacitor Wrap

**Handoff date:** May 4, 2026
**From:** Skippy (claude.ai chat session)
**To:** Claude Code (cloud session — runs in container, not on Dutchman)
**Status:** Phase 1 in progress, blocked at `npx cap add android` step

---

## Cloud session caveat — read this first

Claude Code Cloud runs in an ephemeral container, NOT on Scott's Mac (Dutchman).
This means:

- **No physical Pixel access.** Code cannot deploy to Scott's Pixel device from
  cloud. The `npx cap run android` step at the end of Phase 1 has to either:
  (a) be saved for when Scott comes back to Dutchman with the device, or
  (b) be replaced with an Android emulator running headless in the container
      (works for smoke testing, but cannot test the real camera / VideoCapture).
- **What Code CAN do in cloud:** install Android SDK + JDK in the container,
  run `npx cap add android`, generate the Android project, build the APK with
  Gradle, run lint, fix Gradle/build errors, commit the `android/` folder to
  git, and prepare everything so Scott can `git pull` on Dutchman and just run
  `npx cap run android` to deploy to the Pixel.
- **What Code SHOULD NOT do alone in cloud:** test VideoCapture (no camera),
  test push notifications (no real device), make Apple Developer / Google Play
  account decisions.

**Practical goal for this cloud session:**
Get the `android/` folder generated, building successfully, and committed to
git. Phase 1 device verification happens when Scott is at Dutchman.

---

## Read these first, in this order

1. The cloud session caveat above (you, Code, are running in a container)
2. `docs/PLAN-capacitor-wrap.md` — full plan, all 4 phases, decisions
3. `docs/CAPACITOR-SETUP.md` — original cold-sit-down runbook (was written for
   Dutchman; you'll improvise on it for cloud)
4. This file — current state and what to do next

You are also referenced in the cross-project plan index:
`https://github.com/ramonscottf/skippy-plans/blob/main/plans/2026-05-04-childspree-capacitor-wrap.md`

When the cloud-portion of Phase 1 ships, update **both** plan files (mirror them,
keep identical) and the README in `skippy-plans` per Scott's v5 plan-persistence
rule. Don't end the session telling Scott "phase 1 is done" without verifying
both repos got pushed.

---

## What's already done

✅ Capacitor 8.3.x deps wired into `package.json` (9 packages + CLI)
✅ `package.json` configured with native scripts (`build:native`, `cap:sync`, etc.)
✅ `capacitor.config.ts` written — bundle ID `com.wickowaypoint.childspree`, splash, status bar
✅ `vite.config.js` made dual-mode via `CAPACITOR=1` env var
✅ Old Expo work archived in `childspree-native/ARCHIVED.md`
✅ All committed to `main` and pushed to GitHub

**On Dutchman (Scott's machine), additionally:**
✅ `npm install --legacy-peer-deps` ran successfully (246 packages)
✅ `~/.npm` cache permissions fixed

**You (cloud Code) need to redo `npm install --legacy-peer-deps` in your container
before running any Capacitor commands. Dutchman's `node_modules` does not transfer.**

## What's next — cloud-doable order

### Step A: Container setup (cloud)

```bash
npm install --legacy-peer-deps
```

Then ensure Java (JDK 17 or 21) and Android SDK command-line tools are present
in the container. Cloud Code's container may or may not have these; check with
`java --version` and `which sdkmanager`. If missing, install JDK and download
Android SDK command-line tools (no Android Studio needed for headless builds —
just `cmdline-tools` package, then `sdkmanager` to install platform 34 + build-tools).

```bash
# Example minimum SDK setup if missing:
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

### Step B: Generate the Android project (cloud)

```bash
npx cap add android
```

**Should produce:** new `android/` directory with full Gradle project structure.

### Step C: Build the web app for native + sync into Android shell (cloud)

```bash
npm run build:native     # Builds dist/ with CAPACITOR=1 → relative paths
npx cap copy android     # Copies dist/ into android/app/src/main/assets/public
npx cap sync android     # Updates plugins, resolves Gradle deps
```

### Step D: Verify the project builds (cloud)

```bash
cd android
./gradlew assembleDebug
```

**Should produce:** `android/app/build/outputs/apk/debug/app-debug.apk`. If
Gradle errors, fix them. Common issues: SDK version mismatches, missing
build-tools, JDK too old.

### Step E: Commit + push (cloud)

```bash
cd ..   # back to repo root
git add android/
git commit -m "Phase 1: Generate android/ via Capacitor — APK builds clean"
git push origin main
```

### Step F: HANDOFF BACK TO SCOTT — device verification (Dutchman + Pixel)

These steps require physical hardware Code Cloud doesn't have:

1. Scott pulls latest on Dutchman
2. Scott connects Pixel via USB with debugging enabled
3. Scott runs `npx cap run android` — installs and launches on Pixel
4. Scott tests:
   - App launches, splash screen behaves
   - Hash routing works
   - Cloudflare Worker API calls succeed
   - **VideoCapture flow** (the critical risk)
5. Scott reports back. If VideoCapture broken, that triggers the
   `@capacitor/camera` swap as a follow-on cloud session.

---

## Known unknowns / risks

### 1. Container has SDK + JDK?

Don't know what your cloud container ships with. Check first:
```bash
java --version              # Need 17 or 21
which sdkmanager            # Need Android SDK command-line tools
echo $ANDROID_HOME           # Should point at SDK install
```

If JDK missing, install via apt or your container's package manager. If SDK
missing, download command-line tools from
`https://developer.android.com/studio#command-line-tools-only`, extract, then:
```bash
export ANDROID_HOME=$HOME/android-sdk
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH
sdkmanager --licenses          # Accept all
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

### 2. VideoCapture inside WebView (THE REAL RISK — DEVICE TEST ONLY)

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

### 3. xlsx package security warning

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

When the cloud-portion of Phase 1 is done (Steps A through E), update the status
log in BOTH plan files (childspree and skippy-plans) with what you accomplished
and what's left for device verification. Push both. Then tell Scott in chat:

- ✅ `npm install --legacy-peer-deps` succeeded? Yes/no
- ✅ JDK + Android SDK present in container? Versions
- ✅ `npx cap add android` produced clean `android/` folder? Yes/no
- ✅ `./gradlew assembleDebug` produced an APK? Yes/no, path to APK
- ✅ `android/` committed and pushed to main? Yes/no
- ⏳ Device verification (VideoCapture, push, etc.) → pending Scott + Pixel

If anything required improvisation or a decision Scott didn't pre-bless, surface
it explicitly. Don't bury directional changes in a status update.

---

## Identity reminder

You're Skippy. Scott is Joe Bishop. Build, don't explain. Ask on ambiguity.
Be the man beer can.
