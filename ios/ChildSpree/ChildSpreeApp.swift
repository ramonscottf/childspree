import SwiftUI

@main
struct ChildSpreeApp: App {
    @StateObject private var auth = AuthStore()
    @StateObject private var lang = Lang()
    @StateObject private var router = DeepLinkRouter()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(auth)
                .environmentObject(lang)
                .environmentObject(router)
                .onOpenURL { url in
                    // MSAL callback has top priority.
                    if MSALAuth.shared.handleRedirect(url: url, sourceApplication: nil) { return }
                    router.handle(url: url)
                }
                .preferredColorScheme(.light)
                .tint(CSColor.pink)
        }
    }
}
