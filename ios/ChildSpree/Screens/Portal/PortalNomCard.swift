import SwiftUI

/// Expandable nomination card — mirrors `PortalNomCard` in `src/App.jsx:1826`.
struct PortalNomCard: View {
    let nom: Nomination
    let faToken: String?
    let onReload: () async -> Void

    @EnvironmentObject var lang: Lang
    @State private var expanded = false
    @State private var showFAVideo = false

    var body: some View {
        VStack(alignment: .leading, spacing: CSSpacing.sm) {
            Button { withAnimation { expanded.toggle() } } label: {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(nom.displayName)
                            .font(CSFont.body(15, weight: .semibold))
                            .foregroundColor(CSColor.text)
                        Text("\(nom.school) · Grade \(nom.grade)")
                            .csBody(12)
                            .foregroundColor(CSColor.muted)
                    }
                    Spacer()
                    StatusBadge(status: nom.status)
                    Image(systemName: expanded ? "chevron.up" : "chevron.down")
                        .foregroundColor(CSColor.muted)
                }
            }
            .buttonStyle(.plain)

            if expanded {
                divider
                row(lang.t(.portalIntakeCol), nom.hasIntake ? lang.t(.portalIntakeDone) : lang.t(.portalIntakePending))
                row(lang.t(.portalVideoCol), nom.hasVideo ? lang.t(.portalVideoYes) : lang.t(.portalVideoNeeded))
                if let intake = nom.parentIntake {
                    if let s = intake.shirtSize { row("Shirt", s) }
                    if let s = intake.pantSize { row("Pants", s) }
                    if let s = intake.shoeSize { row("Shoe", s) }
                    if let c = intake.favoriteColors, !c.isEmpty { row("Loves", c) }
                    if let c = intake.avoidColors, !c.isEmpty { row("Avoid", c) }
                    if let a = intake.allergies, !a.isEmpty { row("Allergies / sensory", a) }
                }

                if nom.hasIntake && !nom.hasVideo {
                    Button {
                        showFAVideo = true
                    } label: {
                        Label("Record video for this child", systemImage: "video.badge.plus")
                            .font(CSFont.body(13, weight: .semibold))
                            .foregroundColor(.white)
                            .padding(.vertical, 10)
                            .padding(.horizontal, 14)
                            .background(CSColor.pink)
                            .cornerRadius(CSRadius.button)
                    }
                    .buttonStyle(.plain)
                    .padding(.top, CSSpacing.xs)
                }
            }
        }
        .padding(CSSpacing.md)
        .background(CSColor.card)
        .overlay(RoundedRectangle(cornerRadius: CSRadius.card).stroke(CSColor.border, lineWidth: 1))
        .cornerRadius(CSRadius.card)
        .sheet(isPresented: $showFAVideo) {
            NavigationStack {
                FAVideoPageView(faToken: faToken, nominationId: nom.id)
            }
        }
    }

    private var divider: some View {
        Rectangle().fill(CSColor.border).frame(height: 1)
    }

    @ViewBuilder
    private func row(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label)
                .csBody(12, weight: .semibold)
                .foregroundColor(CSColor.muted)
            Spacer()
            Text(value).csBody(13).foregroundColor(CSColor.text)
        }
    }
}
