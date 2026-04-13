# Bundled fonts

Drop the following TTF files into this folder before building. They're already
referenced by `Info.plist` (`UIAppFonts`) via `project.yml`, so Xcode will pick
them up automatically. If a file is missing, the app falls back to the system
serif / sans-serif via `CSFont` in `DesignSystem/Typography.swift`.

## DM Sans (body) — https://fonts.google.com/specimen/DM+Sans

- `DMSans-Regular.ttf`
- `DMSans-Medium.ttf`
- `DMSans-SemiBold.ttf`
- `DMSans-Bold.ttf`
- `DMSans-ExtraBold.ttf`

## Playfair Display (display) — https://fonts.google.com/specimen/Playfair+Display

- `PlayfairDisplay-SemiBold.ttf`
- `PlayfairDisplay-Bold.ttf`
- `PlayfairDisplay-ExtraBold.ttf`

Both are licensed under the SIL Open Font License; commit them alongside other
assets.
