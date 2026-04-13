import SwiftUI

/// Top-level tab-based nav, mirroring the web app's five nav buttons
/// (Home / Nominate / Volunteer / Portal / Admin) from `src/App.jsx` TopNav.
struct RootView: View {
    @EnvironmentObject var router: DeepLinkRouter
    @EnvironmentObject var auth: AuthStore
    @EnvironmentObject var lang: Lang

    var body: some View {
        Group {
            switch router.route {
            case .intake(let token):
                NavigationStack { ParentIntakeView(token: token) }
            case .fa(let token):
                NavigationStack { FAPortalDashboardView(faToken: token) }
            case .faVideo(let token, let nomId):
                NavigationStack { FAVideoPageView(faToken: token, nominationId: nomId) }
            default:
                mainTabs
            }
        }
        .overlay(alignment: .topTrailing) {
            if case .intake = router.route {} // no lang toggle here; intake is scoped
            else if case .fa = router.route {}
            else if case .faVideo = router.route {}
            else {
                LangToggle().padding(.top, 6).padding(.trailing, 12)
            }
        }
    }

    private var mainTabs: some View {
        TabView(selection: $router.selectedTab) {
            NavigationStack { LandingView() }
                .tabItem { Label(lang.t(.home), systemImage: "house.fill") }
                .tag(DeepLinkRouter.Tab.home)

            NavigationStack { NominationFormView() }
                .tabItem { Label(lang.t(.nominate), systemImage: "square.and.pencil") }
                .tag(DeepLinkRouter.Tab.nominate)

            NavigationStack { VolunteerFormView() }
                .tabItem { Label(lang.t(.volunteer), systemImage: "cart.fill") }
                .tag(DeepLinkRouter.Tab.volunteer)

            NavigationStack { FAPortalEntryView() }
                .tabItem { Label(lang.t(.portal), systemImage: "list.clipboard.fill") }
                .tag(DeepLinkRouter.Tab.portal)

            NavigationStack {
                if auth.adminUnlocked { AdminDashboardView() } else { AdminGate() }
            }
            .tabItem { Label(lang.t(.admin), systemImage: "gearshape.fill") }
            .tag(DeepLinkRouter.Tab.admin)
        }
    }
}

/// Small language toggle shown in the top-right of public screens.
/// Mirrors `LangToggle` in `src/App.jsx:262`.
struct LangToggle: View {
    @EnvironmentObject var lang: Lang
    var body: some View {
        HStack(spacing: 0) {
            langBtn("EN", code: .en)
            Rectangle().fill(CSColor.border).frame(width: 1, height: 14)
            langBtn("ES", code: .es)
        }
        .padding(.horizontal, 2)
        .background(CSColor.card)
        .overlay(
            Capsule().stroke(CSColor.border, lineWidth: 1)
        )
        .clipShape(Capsule())
    }

    @ViewBuilder private func langBtn(_ label: String, code: Lang.Code) -> some View {
        Button(action: { lang.code = code }) {
            Text(label)
                .font(CSFont.body(11, weight: .bold))
                .foregroundColor(lang.code == code ? CSColor.pink : CSColor.muted)
                .padding(.vertical, 6)
                .padding(.horizontal, 10)
        }
        .buttonStyle(.plain)
    }
}
