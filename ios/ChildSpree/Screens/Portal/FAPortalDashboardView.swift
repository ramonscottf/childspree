import SwiftUI

/// FA portal dashboard — mirrors the dashboard half of `FAPortal` in
/// `src/App.jsx:1971`, plus `PortalNomCard` (`App.jsx:1826`).
struct FAPortalDashboardView: View {
    let faToken: String?
    @EnvironmentObject var lang: Lang
    @EnvironmentObject var auth: AuthStore
    @StateObject private var vm = DashboardVM()

    init(faToken: String? = nil) { self.faToken = faToken }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: CSSpacing.lg) {
                header
                if let err = vm.error {
                    Text(err).csBody(14).foregroundColor(CSColor.red)
                }
                if let stats = vm.stats { statsGrid(stats) }
                needsVideoSection
                allNominationsSection
            }
            .padding(CSSpacing.lg)
        }
        .background(CSColor.bg)
        .navigationTitle(lang.t(.portal))
        .navigationBarTitleDisplayMode(.inline)
        .task { await vm.load(token: effectiveToken) }
        .refreshable { await vm.load(token: effectiveToken) }
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(lang.t(.portalLogout)) { auth.signOutFA() }
                    .font(CSFont.body(13))
                    .foregroundColor(CSColor.muted)
            }
        }
    }

    private var effectiveToken: String? { faToken ?? auth.faToken }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("\(lang.t(.portalWelcome)) \(auth.faName ?? auth.faEmail ?? "")")
                .csDisplay(22)
                .foregroundColor(CSColor.navy)
            if let school = auth.faSchool, !school.isEmpty {
                Text(school)
                    .csBody(13)
                    .foregroundColor(CSColor.muted)
            }
        }
    }

    private func statsGrid(_ stats: PortalStats) -> some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: CSSpacing.md) {
            StatTile(label: lang.t(.portalTotal), value: "\(stats.total)", color: CSColor.navy)
            StatTile(label: lang.t(.portalIntake), value: "\(stats.intakeComplete)", color: CSColor.green)
            StatTile(label: lang.t(.portalNeedsVideo), value: "\(stats.needsVideo)", color: CSColor.amber)
            StatTile(label: lang.t(.portalAwaiting), value: "\(stats.awaitingParent)", color: CSColor.blue)
        }
    }

    private var needsVideoSection: some View {
        let needsVideo = vm.nominations.filter {
            ($0.parentIntake != nil) && !($0.parentIntake?.hasVideo ?? false)
        }
        return VStack(alignment: .leading, spacing: CSSpacing.sm) {
            Text(lang.t(.portalNeedsVideoTitle))
                .csDisplay(18, weight: .semibold)
                .foregroundColor(CSColor.navy)
            if needsVideo.isEmpty {
                Text(lang.t(.portalNeedsVideoEmpty))
                    .csBody(13)
                    .foregroundColor(CSColor.muted)
            } else {
                ForEach(needsVideo) { nom in
                    PortalNomCard(nom: nom, faToken: effectiveToken, onReload: { await vm.load(token: effectiveToken) })
                }
            }
        }
    }

    private var allNominationsSection: some View {
        VStack(alignment: .leading, spacing: CSSpacing.sm) {
            Text(lang.t(.portalAllTitle))
                .csDisplay(18, weight: .semibold)
                .foregroundColor(CSColor.navy)
            ForEach(vm.nominations) { nom in
                PortalNomCard(nom: nom, faToken: effectiveToken, onReload: { await vm.load(token: effectiveToken) })
            }
        }
    }
}

struct StatTile: View {
    let label: String
    let value: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(value)
                .csDisplay(28)
                .foregroundColor(color)
            Text(label)
                .csBody(11, weight: .semibold)
                .foregroundColor(CSColor.muted)
                .textCase(.uppercase)
                .tracking(0.5)
        }
        .padding(CSSpacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(CSColor.card)
        .overlay(RoundedRectangle(cornerRadius: CSRadius.card).stroke(CSColor.border, lineWidth: 1))
        .cornerRadius(CSRadius.card)
    }
}

@MainActor
final class DashboardVM: ObservableObject {
    @Published var nominations: [Nomination] = []
    @Published var stats: PortalStats?
    @Published var loading = false
    @Published var error: String?

    func load(token: String?) async {
        guard let token else {
            error = "Not signed in."
            return
        }
        loading = true
        error = nil
        defer { loading = false }

        do {
            let resp = try await APIClient.shared.request(
                .portalDashboard,
                as: PortalDashboardResponse.self,
                headers: ["X-FA-Token": token]
            )
            self.nominations = resp.nominations
            self.stats = resp.stats
        } catch {
            self.error = error.localizedDescription
        }
    }
}
