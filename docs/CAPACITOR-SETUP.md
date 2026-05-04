# Capacitor Setup — Phase 1 Runbook

**Audience:** Scott at Dutchman, with this file open.
**Goal:** Get a Child Spree Android build running on the Pixel.
**Time:** ~30 min active, plus Android Studio download (~3 GB) which can run in background.

This is the cold-sit-down version. Every step. Every command. What you should
see after each one. No prerequisites assumed beyond Dutchman being on and you
being logged in.

---

## Step 0 — Pull this branch

The Capacitor wiring (config files, package.json, vite changes) is already
committed to `main` from the May 4 2026 chat. You just need to pull it.

```bash
cd ~/Projects/childspree
git pull origin main
```

**You should see:** A few new files including `capacitor.config.ts`, an
updated `package.json`, and `childspree-native/ARCHIVED.md`.

---

## Step 1 — Install Android Studio

This is the slow step. Start it first, work on Step 2 in parallel.

**Open:** Spotlight (⌘+Space) → type "App Store" → Enter
**Search:** "Android Studio" — actually no, App Store doesn't have it. Use
the direct download instead.

**Open Safari, go to:** https://developer.android.com/studio

Click the big green "Download Android Studio" button. Accept the license. The
download is ~1.2 GB.

**While it downloads:** continue to Step 2.

**After download completes:**
1. Open the `.dmg` from `~/Downloads/`
2. Drag Android Studio to Applications (⌘+drag)
3. Eject the DMG (right-click → Eject)
4. Open Applications → Android Studio (right-click → Open the first time so
   macOS doesn't block it)
5. **Setup wizard:** "Standard" install type. Accept all license agreements.
   This downloads another ~2 GB of SDK components. Walk away. Get coffee.

**You'll know it's done when:** You see the Android Studio welcome screen with
"Open" / "Get from VCS" buttons.

---

## Step 2 — Install Java (JDK 21)

Capacitor 8 needs JDK 21 (or 17 minimum). Android Studio bundles its own JDK,
but the Capacitor CLI runs outside Android Studio and needs a system JDK on `PATH`.

**Check what you already have:**
```bash
java --version
```

**If it says 21.x.x or higher:** skip to Step 3.
**If it says 17 or lower, or "command not found":** install via Homebrew.

```bash
brew install openjdk@21
```

After install, link it:

```bash
sudo ln -sfn $(brew --prefix)/opt/openjdk@21/libexec/openjdk.jdk \
  /Library/Java/JavaVirtualMachines/openjdk-21.jdk
```

Add to your shell (`~/.zshrc`):

```bash
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 21)' >> ~/.zshrc
echo 'export PATH="$JAVA_HOME/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Verify:**
```bash
java --version
```
**Should say:** `openjdk 21.x.x`

---

## Step 3 — Install npm dependencies

```bash
cd ~/Projects/childspree
npm install
```

**You should see:** ~30 seconds of installs, ending with "added N packages, audited M packages."
**Expect a few warnings about peer deps** — those are Capacitor + xlsx grumbling at each other, harmless.

---

## Step 4 — Build the web app for native

```bash
npm run build:native
```

**You should see:** Vite output ending with something like
`✓ built in 8.42s` and a `dist/` directory with relative-path assets.

**Sanity check:** `cat dist/index.html | head -3` — the `<script>` tag should
reference `./assets/index-*.js` with a leading `./` (relative path), not `/assets/...`.

---

## Step 5 — Add the Android platform

```bash
npx cap add android
```

**You should see:**
- `✔ Adding native android project in android`
- `✔ Syncing Gradle`
- `✔ add in Xms`
- A new `android/` directory in the project

**If it fails with "Could not determine the dependencies":** Android Studio's
SDK isn't on your `PATH` yet. Open Android Studio → Settings → Languages & Frameworks
→ Android SDK → copy the SDK path → add to `~/.zshrc`:

```bash
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
echo 'export PATH=$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH' >> ~/.zshrc
source ~/.zshrc
```

Then re-run `npx cap add android`.

---

## Step 6 — Sync the web build into the Android shell

```bash
npx cap sync android
```

**You should see:**
- `✔ Copying web assets`
- `✔ Creating capacitor.config.json in android/app/src/main/assets`
- `✔ copy android in Xms`
- `✔ Updating Android plugins`
- `✔ update android in Xms`

---

## Step 7 — Plug in the Pixel and enable USB debugging

**On the Pixel:**
1. Settings → About phone
2. Tap "Build number" 7 times until it says "You are now a developer"
3. Back to Settings → System → Developer options
4. Turn on "USB debugging"

**Plug Pixel into Dutchman with USB-C cable.**
**Pixel will prompt:** "Allow USB debugging from this computer?" — tap Allow.

**Verify Dutchman sees it:**
```bash
adb devices
```
**Should show:** Your Pixel listed with status `device` (not `unauthorized`).

If `adb` isn't found, add platform-tools to PATH (see Step 5 fallback).

---

## Step 8 — Build and run on the Pixel

```bash
npx cap run android
```

**Pick the Pixel from the device list** when prompted.

**You should see:**
- Gradle build (~2-3 min the first time, much faster on subsequent builds)
- "BUILD SUCCESSFUL"
- The app installs and launches on the Pixel

**If Gradle fails:** open `android/` in Android Studio (`npx cap open android`)
and let Android Studio resolve the dependency tree itself once. Then come back
and re-run `npx cap run android`.

---

## Step 9 — Test the critical flows on Pixel

The whole point of Phase 1 is verifying nothing breaks inside the WebView.
**Specifically test:**

- [ ] App launches, splash screen shows then dismisses cleanly
- [ ] Home screen renders correctly (DM Sans font loads — needs internet)
- [ ] Hash routing works (navigate between screens, no white-screen-of-death)
- [ ] Cloudflare Worker API calls succeed (try a nomination form submit)
- [ ] **VideoCapture flow** — this is the one risk. Tap whatever triggers the
      9:16 video capture. Grant camera permission when prompted.
  - ✅ If recording works, ship it. We're golden.
  - ❌ If it fails or hangs, that's the moment to wire `@capacitor/camera`.
       Note the failure mode (does it ask for permission? does the prompt fire
       but the camera never opens? does the recorded blob fail to upload?) and
       drop the details into the Phase 1 status log in `PLAN-capacitor-wrap.md`.

---

## When Step 9 is done

Two outcomes:

**✅ Everything worked:**
- Update `docs/PLAN-capacitor-wrap.md` Phase 1 checklist with `[x]`
- Update `skippy-plans/plans/2026-05-04-childspree-capacitor-wrap.md` to match
- Commit both, push
- Tell Skippy "Phase 1 done, start Phase 2 (push notifications)"

**❌ VideoCapture broke:**
- Note the failure mode in the plan status log
- Tell Skippy "Phase 1 mostly works, video broken with: <description>"
- Skippy will write the `@capacitor/camera` swap and you'll re-run Steps 6-9

---

## Reference — what changed in this commit set

- `package.json` — added 9 Capacitor packages, 4 new scripts (`build:native`,
  `cap:sync`, `cap:android`, `cap:ios`)
- `vite.config.js` — `base: isCapacitor ? './' : '/'` so the same code builds
  for both web deploys and native shells
- `capacitor.config.ts` — bundle ID `com.wickowaypoint.childspree`, splash and
  status bar configured to match `#1B3A4B` theme
- `childspree-native/ARCHIVED.md` — explicitly marks the Expo work as superseded
- `docs/PLAN-capacitor-wrap.md` — full plan
- `docs/CAPACITOR-SETUP.md` — this file

**Nothing in `src/` was changed.** The web app behavior on `childspree.org` is
untouched. The wrap is purely additive.

---

## When you're back at the desk

If anything in this runbook is unclear, ambiguous, or just wrong — that's
Skippy's bug. Tell me and I'll fix the runbook in-place.
