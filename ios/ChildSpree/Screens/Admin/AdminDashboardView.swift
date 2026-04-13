import SwiftUI

/// Admin dashboard — mirrors `AdminDashboard` in `src/App.jsx`.
/// Three tabs (Nominations / Volunteers / Advocates) plus Stats.
/// Password gate lives in `AdminGate.swift`; this view assumes the gate has
/// already unlocked the session.
struct AdminDashboardView: View {
    @EnvironmentObject var auth: AuthStore
    @EnvironmentObject var lang: Lang
    @State private var tab: Tab = .nominations

    enum Tab: String, CaseIterable, Identifiable {
        case nominations, volunteers, advocates, stats
        var id: String { rawValue }
        var title: String {
            switch self {
            case .nominations: return "Nominations"
            case .volunteers:  return "Volunteers"
            case .advocates:   return "Advocates"
            case .stats:       return "Stats"
            }
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            tabBar
            Divider()
            content
        }
        .background(CSColor.bg)
        .navigationTitle("Admin")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Lock") { auth.lockAdmin() }
                    .font(CSFont.body(13))
                    .foregroundColor(CSColor.muted)
            }
        }
    }

    private var tabBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: CSSpacing.sm) {
                ForEach(Tab.allCases) { t in
                    ChipButton(title: t.title, isSelected: tab == t) { tab = t }
                }
            }
            .padding(.horizontal, CSSpacing.lg)
            .padding(.vertical, CSSpacing.sm)
        }
        .background(CSColor.card)
    }

    @ViewBuilder
    private var content: some View {
        switch tab {
        case .nominations: AdminNominationsTab()
        case .volunteers:  AdminVolunteersTab()
        case .advocates:   AdminAdvocatesTab()
        case .stats:       AdminStatsView()
        }
    }
}
