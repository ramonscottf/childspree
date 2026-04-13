import SwiftUI

/// Color palette mirroring `C` in `src/App.jsx:320`.
/// Values are duplicated here in code (and also defined in Assets.xcassets)
/// so the app still renders correctly even if assets are stripped.
enum CSColor {
    static let navy      = Color(hex: 0x1B3A4B)
    static let pink      = Color(hex: 0xE8548C)
    static let pinkLight = Color(hex: 0xF9A8C9)
    static let bg        = Color(hex: 0xF8FAFC)
    static let card      = Color.white
    static let border    = Color(hex: 0xE2E8F0)
    static let text      = Color(hex: 0x1E293B)
    static let muted     = Color(hex: 0x64748B)
    static let light     = Color(hex: 0x94A3B8)
    static let green     = Color(hex: 0x059669)
    static let red       = Color(hex: 0xDC2626)
    static let amber     = Color(hex: 0xD97706)
    static let blue      = Color(hex: 0x2563EB)
}

enum CSSpacing {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 24
    static let xxl: CGFloat = 32
    static let xxxl: CGFloat = 48
}

enum CSRadius {
    static let input: CGFloat = 8
    static let button: CGFloat = 10
    static let card: CGFloat = 14
    static let hero: CGFloat = 16
    static let pill: CGFloat = 20
}

extension Color {
    init(hex: UInt32, alpha: Double = 1) {
        let r = Double((hex >> 16) & 0xff) / 255.0
        let g = Double((hex >> 8) & 0xff) / 255.0
        let b = Double(hex & 0xff) / 255.0
        self.init(.sRGB, red: r, green: g, blue: b, opacity: alpha)
    }
}
