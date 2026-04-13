import SwiftUI

/// Top-level Portal entry: shows login if unauthenticated, dashboard otherwise.
struct FAPortalEntryView: View {
    @EnvironmentObject var auth: AuthStore

    var body: some View {
        if auth.faToken != nil {
            FAPortalDashboardView()
        } else {
            FAPortalLoginView()
        }
    }
}
