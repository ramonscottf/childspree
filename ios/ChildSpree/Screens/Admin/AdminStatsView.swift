import SwiftUI

/// Admin stats — mirrors the stats tab of `AdminDashboard`. Pulls
/// `GET /api/stats` and shows totals-by-status, top schools, and recent activity.
struct AdminStatsView: View {
    @StateObject private var vm = AdminStatsVM()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: CSSpacing.lg) {
                if let err = vm.error {
                    Text(err).csBody(13).foregroundColor(CSColor.red)
                }

                if let stats = vm.stats {
                    totalCard(stats.total)
                    byStatusSection(stats.byStatus)
                    if !stats.bySchool.isEmpty { bySchoolSection(stats.bySchool) }
                    if !stats.recent.isEmpty  { recentSection(stats.recent) }
                } else if vm.loading {
                    ProgressView().padding(CSSpacing.xl)
                }
            }
            .padding(CSSpacing.lg)
        }
        .task { await vm.load() }
        .refreshable { await vm.load() }
    }

    private func totalCard(_ total: Int) -> some View {
        CSCard {
            VStack(alignment: .leading, spacing: 4) {
                Text("Total Nominations").csBody(12, weight: .semibold).foregroundColor(CSColor.muted)
                Text("\(total)").csDisplay(36).foregroundColor(CSColor.navy)
            }
        }
    }

    private func byStatusSection(_ byStatus: [String: Int]) -> some View {
        VStack(alignment: .leading, spacing: CSSpacing.sm) {
            CSSectionHeader(text: "By Status")
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: CSSpacing.md) {
                ForEach(byStatus.keys.sorted(), id: \.self) { key in
                    StatTile(
                        label: key.capitalized,
                        value: "\(byStatus[key] ?? 0)",
                        color: tileColor(for: key)
                    )
                }
            }
        }
    }

    private func bySchoolSection(_ items: [AdminStats.SchoolCount]) -> some View {
        VStack(alignment: .leading, spacing: CSSpacing.sm) {
            CSSectionHeader(text: "By School")
            CSCard(padding: 0) {
                VStack(spacing: 0) {
                    ForEach(Array(items.enumerated()), id: \.offset) { idx, row in
                        HStack {
                            Text(row.school).csBody(13).foregroundColor(CSColor.text)
                            Spacer()
                            Text("\(row.count)")
                                .csBody(13, weight: .semibold)
                                .foregroundColor(CSColor.navy)
                        }
                        .padding(.vertical, 10)
                        .padding(.horizontal, CSSpacing.md)
                        if idx < items.count - 1 {
                            Rectangle().fill(CSColor.border).frame(height: 1)
                        }
                    }
                }
            }
        }
    }

    private func recentSection(_ items: [AdminStats.RecentNomination]) -> some View {
        VStack(alignment: .leading, spacing: CSSpacing.sm) {
            CSSectionHeader(text: "Recent Activity")
            VStack(spacing: CSSpacing.sm) {
                ForEach(items) { r in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("\(r.childFirst) \(r.childLast)")
                                .csBody(14, weight: .semibold)
                                .foregroundColor(CSColor.text)
                            Text(r.school).csBody(12).foregroundColor(CSColor.muted)
                        }
                        Spacer()
                        StatusBadge(status: r.status)
                    }
                    .padding(CSSpacing.md)
                    .background(CSColor.card)
                    .overlay(RoundedRectangle(cornerRadius: CSRadius.card).stroke(CSColor.border, lineWidth: 1))
                    .cornerRadius(CSRadius.card)
                }
            }
        }
    }

    private func tileColor(for status: String) -> Color {
        switch status {
        case "pending":  return CSColor.amber
        case "approved": return CSColor.green
        case "sent":     return CSColor.blue
        case "complete": return CSColor.navy
        case "declined": return CSColor.red
        default:         return CSColor.muted
        }
    }
}

@MainActor
final class AdminStatsVM: ObservableObject {
    @Published var stats: AdminStats?
    @Published var loading = false
    @Published var error: String?

    func load() async {
        loading = true
        error = nil
        defer { loading = false }
        do {
            self.stats = try await APIClient.shared.request(.stats, as: AdminStats.self)
        } catch {
            self.error = error.localizedDescription
        }
    }
}
