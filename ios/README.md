# Child Spree — Native iOS (Swift / SwiftUI)

A pure-native iOS port of [childspree.org](https://childspree.org). 100% SwiftUI
(iOS 16+), consuming the existing Cloudflare Workers API at
`https://childspree.org/api/*`. No backend changes.

Scope mirrors the web app 1:1:

- Landing, Nominate, Volunteer (public)
- Parent Intake + Video Capture (token-gated deep link)
- Family Advocate Portal with Microsoft 365 SSO (MSAL)
- Admin dashboard (Nominations / Volunteers / Advocates / Stats)
- Bilingual (English / Español)

## Building

This project uses [XcodeGen](https://github.com/yonaskolb/XcodeGen) instead of
a checked-in `.xcodeproj` (much friendlier for code review and merges).

```bash
brew install xcodegen
cd ios
xcodegen generate
open ChildSpree.xcodeproj
```

Then ⌘R on an iOS 16+ simulator. Fonts (DM Sans + Playfair Display `.ttf`
files) need to be dropped into `ChildSpree/Resources/Fonts/` — see
`Resources/Fonts/README.md` for download URLs. The app falls back to system
fonts if they're missing, so the build works without them.

## Architecture

```
ChildSpree/
├── ChildSpreeApp.swift           # @main, MSAL redirect, deep link handling
├── Models/                        # Codable types mirroring the API
├── Networking/                    # APIClient + endpoints + multipart upload
├── Auth/                          # MSAL wrapper, FA session store, admin gate
├── Localization/                  # @Observable Lang, full en+es dictionary
├── DesignSystem/                  # Colors, fonts, buttons, inputs, badges
├── Navigation/                    # RootView (TabView), DeepLinkRouter
├── Screens/                       # One folder per web route
└── Utilities/                     # Haptics, carousel, misc
```

## Configuration

- **API base:** `https://childspree.org` — see `Networking/APIClient.swift`
- **MSAL client ID / tenant:** `Auth/MSALAuth.swift` (same IDs as the web MSAL config in `src/App.jsx`)
- **Admin password:** entered at runtime (no build-time secret; matches web behavior)

## Coordination

The iOS app is completely isolated under `ios/`. The rest of the repo
(`src/`, `functions/`, `childspree-native/`, root configs) is untouched so
Codex can work in parallel on the web + backend.
