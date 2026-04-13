import SwiftUI

/// Status pill — mirrors `StatusBadge` in App.jsx:329.
struct StatusBadge: View {
    let status: String
    var isVolunteer: Bool = false

    var body: some View {
        let style = resolveStyle()
        Text(style.label.uppercased())
            .font(CSFont.body(11, weight: .semibold))
            .tracking(0.3)
            .foregroundColor(style.fg)
            .padding(.vertical, 3)
            .padding(.horizontal, 10)
            .background(style.bg)
            .cornerRadius(CSRadius.pill)
    }

    private struct Style {
        let bg: Color
        let fg: Color
        let label: String
    }

    private func resolveStyle() -> Style {
        if isVolunteer {
            switch status {
            case "registered": return Style(bg: Color(hex: 0xE0E7FF), fg: Color(hex: 0x3730A3), label: "Registered")
            case "confirmed":  return Style(bg: Color(hex: 0xD1FAE5), fg: Color(hex: 0x065F46), label: "Confirmed")
            case "assigned":   return Style(bg: Color(hex: 0xDBEAFE), fg: Color(hex: 0x1E40AF), label: "Assigned")
            case "attended":   return Style(bg: Color(hex: 0xFEF3C7), fg: Color(hex: 0x92400E), label: "Attended")
            default:           return Style(bg: Color(hex: 0xE0E7FF), fg: Color(hex: 0x3730A3), label: "Registered")
            }
        }
        switch status {
        case "pending":    return Style(bg: Color(hex: 0xFEF3C7), fg: Color(hex: 0x92400E), label: "Pending")
        case "approved":   return Style(bg: Color(hex: 0xD1FAE5), fg: Color(hex: 0x065F46), label: "Approved")
        case "sent":       return Style(bg: Color(hex: 0xDBEAFE), fg: Color(hex: 0x1E40AF), label: "Sent")
        case "complete":   return Style(bg: Color(hex: 0xE0E7FF), fg: Color(hex: 0x3730A3), label: "Complete")
        case "incomplete": return Style(bg: Color(hex: 0xFEE2E2), fg: Color(hex: 0xDC2626), label: "Incomplete")
        case "declined":   return Style(bg: Color(hex: 0xFEE2E2), fg: Color(hex: 0x991B1B), label: "Declined")
        default:           return Style(bg: Color(hex: 0xFEF3C7), fg: Color(hex: 0x92400E), label: "Pending")
        }
    }
}
