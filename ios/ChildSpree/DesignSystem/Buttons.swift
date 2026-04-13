import SwiftUI

/// Primary pink CTA, matches `background:C.pink` buttons in App.jsx.
struct PinkButton: View {
    let title: String
    var isLoading: Bool = false
    var isFullWidth: Bool = true
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: CSSpacing.sm) {
                if isLoading {
                    ProgressView().tint(.white)
                }
                Text(title)
                    .font(CSFont.body(15, weight: .bold))
                    .foregroundColor(.white)
            }
            .frame(maxWidth: isFullWidth ? .infinity : nil)
            .padding(.vertical, 14)
            .padding(.horizontal, 28)
            .background(CSColor.pink)
            .cornerRadius(CSRadius.button)
            .shadow(color: CSColor.pink.opacity(0.35), radius: 12, x: 0, y: 4)
        }
        .disabled(isLoading)
    }
}

/// Dark navy button used as secondary / reverse CTA.
struct NavyButton: View {
    let title: String
    var isFullWidth: Bool = true
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(CSFont.body(14, weight: .bold))
                .foregroundColor(.white)
                .frame(maxWidth: isFullWidth ? .infinity : nil)
                .padding(.vertical, 13)
                .padding(.horizontal, 28)
                .background(CSColor.navy)
                .cornerRadius(CSRadius.input)
        }
    }
}

/// Translucent outline button used over hero imagery.
struct OutlineButton: View {
    let title: String
    var tint: Color = .white
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(CSFont.body(14, weight: .semibold))
                .foregroundColor(tint)
                .padding(.vertical, 12)
                .padding(.horizontal, 24)
                .background(Color.white.opacity(0.15))
                .overlay(
                    RoundedRectangle(cornerRadius: CSRadius.button)
                        .stroke(tint.opacity(0.4), lineWidth: 1.5)
                )
                .cornerRadius(CSRadius.button)
        }
    }
}

/// Compact chip used for inline filters and size pickers.
struct ChipButton: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(CSFont.body(13, weight: isSelected ? .semibold : .regular))
                .foregroundColor(isSelected ? .white : CSColor.text)
                .padding(.vertical, 8)
                .padding(.horizontal, 14)
                .background(isSelected ? CSColor.navy : CSColor.bg)
                .overlay(
                    RoundedRectangle(cornerRadius: CSRadius.pill)
                        .stroke(isSelected ? CSColor.navy : CSColor.border, lineWidth: 1.5)
                )
                .cornerRadius(CSRadius.pill)
        }
        .buttonStyle(.plain)
    }
}
