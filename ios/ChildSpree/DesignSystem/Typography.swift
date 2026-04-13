import SwiftUI

/// Typography mirroring the web app's DM Sans (body) + Playfair Display (display).
/// Falls back to system fonts if the custom TTFs aren't bundled.
enum CSFont {
    // Body (DM Sans)
    static func body(_ size: CGFloat, weight: Weight = .regular) -> Font {
        let name = weight.dmSansName
        if let _ = UIFont(name: name, size: size) {
            return .custom(name, size: size)
        }
        return .system(size: size, weight: weight.systemWeight)
    }

    // Display (Playfair Display)
    static func display(_ size: CGFloat, weight: DisplayWeight = .bold) -> Font {
        let name = weight.playfairName
        if let _ = UIFont(name: name, size: size) {
            return .custom(name, size: size)
        }
        return .system(size: size, weight: weight.systemWeight, design: .serif)
    }

    enum Weight {
        case regular, medium, semibold, bold, extrabold

        var dmSansName: String {
            switch self {
            case .regular: return "DMSans-Regular"
            case .medium: return "DMSans-Medium"
            case .semibold: return "DMSans-SemiBold"
            case .bold: return "DMSans-Bold"
            case .extrabold: return "DMSans-ExtraBold"
            }
        }

        var systemWeight: Font.Weight {
            switch self {
            case .regular: return .regular
            case .medium: return .medium
            case .semibold: return .semibold
            case .bold: return .bold
            case .extrabold: return .heavy
            }
        }
    }

    enum DisplayWeight {
        case semibold, bold, extrabold

        var playfairName: String {
            switch self {
            case .semibold: return "PlayfairDisplay-SemiBold"
            case .bold: return "PlayfairDisplay-Bold"
            case .extrabold: return "PlayfairDisplay-ExtraBold"
            }
        }

        var systemWeight: Font.Weight {
            switch self {
            case .semibold: return .semibold
            case .bold: return .bold
            case .extrabold: return .heavy
            }
        }
    }
}

/// Common text style helpers.
extension View {
    func csBody(_ size: CGFloat = 14, weight: CSFont.Weight = .regular) -> some View {
        self.font(CSFont.body(size, weight: weight))
    }

    func csDisplay(_ size: CGFloat, weight: CSFont.DisplayWeight = .bold) -> some View {
        self.font(CSFont.display(size, weight: weight))
    }

    /// Small, spaced, uppercase section label — mirrors `secHead` in App.jsx:323
    func csSectionHeader() -> some View {
        self
            .font(CSFont.body(11, weight: .bold))
            .foregroundColor(CSColor.navy)
            .textCase(.uppercase)
            .tracking(1.2)
    }
}
