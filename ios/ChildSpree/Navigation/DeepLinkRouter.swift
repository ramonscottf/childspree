import SwiftUI

/// Observable deep-link state. Parses `childspree://` URLs and mirrors the
/// hash-routes used on the web (`#/intake/:token`, `#/fa/:token`, etc.).
@MainActor
final class DeepLinkRouter: ObservableObject {
    enum Route: Equatable {
        case none
        case intake(token: String)
        case fa(token: String)
        case faVideo(token: String, nominationId: String)
        case tab(Tab)
    }

    enum Tab: Hashable { case home, nominate, volunteer, portal, admin }

    @Published var route: Route = .none
    @Published var selectedTab: Tab = .home

    /// Parses URLs like:
    /// - `childspree://intake/<token>`
    /// - `childspree://fa/<token>`
    /// - `childspree://fa/<token>/video/<nominationId>`
    /// - `childspree://nominate` etc.
    /// Also handles `https://childspree.org/#/intake/<token>` via universal links.
    func handle(url: URL) {
        // Normalize: strip scheme + optional fragment (#/...)
        let raw: String
        if let fragment = url.fragment, !fragment.isEmpty {
            raw = fragment.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        } else {
            // childspree://intake/xxx — host=intake, path=/xxx
            let host = url.host ?? ""
            let path = url.path
            raw = host + path
        }
        let parts = raw.split(separator: "/").map(String.init)
        guard let first = parts.first else {
            route = .tab(.home); selectedTab = .home; return
        }

        switch first {
        case "intake" where parts.count >= 2:
            route = .intake(token: parts[1])
        case "fa" where parts.count >= 4 && parts[2] == "video":
            route = .faVideo(token: parts[1], nominationId: parts[3])
        case "fa" where parts.count >= 2:
            route = .fa(token: parts[1])
        case "nominate":
            selectedTab = .nominate; route = .tab(.nominate)
        case "volunteer":
            selectedTab = .volunteer; route = .tab(.volunteer)
        case "admin":
            selectedTab = .admin; route = .tab(.admin)
        case "portal":
            selectedTab = .portal; route = .tab(.portal)
        default:
            selectedTab = .home; route = .tab(.home)
        }
    }

    func clear() { route = .none }
}
