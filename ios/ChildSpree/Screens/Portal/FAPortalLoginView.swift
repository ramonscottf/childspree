import SwiftUI

/// Portal login — mirrors `FAPortal` login view in `src/App.jsx:1971`.
/// Primary path: Microsoft SSO. Fallback: email (+ optional phone).
struct FAPortalLoginView: View {
    @EnvironmentObject var lang: Lang
    @EnvironmentObject var auth: AuthStore
    @StateObject private var vm = PortalLoginVM()

    var body: some View {
        ScrollView {
            VStack(spacing: CSSpacing.lg) {
                VStack(spacing: CSSpacing.xs) {
                    Text("📋").font(.system(size: 42))
                    Text(lang.t(.portalTitle))
                        .csDisplay(26)
                        .foregroundColor(CSColor.navy)
                    Text(lang.t(.portalSubtitle))
                        .csBody(14)
                        .foregroundColor(CSColor.muted)
                }
                .padding(.top, CSSpacing.xxl)

                CSCard {
                    VStack(alignment: .leading, spacing: CSSpacing.md) {
                        Button {
                            Task { await vm.signInWithMicrosoft(auth: auth) }
                        } label: {
                            HStack(spacing: CSSpacing.sm) {
                                Image(systemName: "m.square.fill")
                                    .font(.system(size: 18, weight: .bold))
                                Text("Sign in with Microsoft (DSD)")
                                    .font(CSFont.body(14, weight: .bold))
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(CSColor.navy)
                            .cornerRadius(CSRadius.button)
                        }

                        HStack {
                            Rectangle().fill(CSColor.border).frame(height: 1)
                            Text("or")
                                .csBody(11, weight: .medium)
                                .foregroundColor(CSColor.light)
                            Rectangle().fill(CSColor.border).frame(height: 1)
                        }

                        CSTextField(
                            label: lang.t(.portalEmailLabel),
                            text: $vm.email,
                            placeholder: lang.t(.portalEmailPlaceholder),
                            keyboard: .emailAddress,
                            autocap: .never
                        )

                        if let err = vm.error {
                            Text(err).csBody(13).foregroundColor(CSColor.red)
                        }

                        PinkButton(
                            title: vm.loading ? lang.t(.portalLoggingIn) : lang.t(.portalLogin),
                            isLoading: vm.loading
                        ) {
                            Task { await vm.signInWithEmail(auth: auth) }
                        }
                    }
                }
                .padding(.horizontal, CSSpacing.lg)
            }
        }
        .background(CSColor.bg)
        .navigationTitle(lang.t(.portal))
        .navigationBarTitleDisplayMode(.inline)
    }
}

@MainActor
final class PortalLoginVM: ObservableObject {
    @Published var email = ""
    @Published var loading = false
    @Published var error: String?

    func signInWithEmail(auth: AuthStore) async {
        error = nil
        let trimmed = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.contains("@") else {
            error = "Please enter a valid email address."
            return
        }
        loading = true
        defer { loading = false }
        let req = PortalLoginRequest(email: trimmed, phone: nil, sso: false, name: nil, msToken: nil)
        do {
            let resp = try await APIClient.shared.request(
                .portalLogin, as: PortalLoginResponse.self, body: req
            )
            auth.persistPortalLogin(resp)
        } catch let err as APIClient.APIError where err.statusCode == 404 {
            self.error = "No nominations found for this email. Please use the exact email you used when submitting nominations."
        } catch {
            self.error = error.localizedDescription
        }
    }

    func signInWithMicrosoft(auth: AuthStore) async {
        error = nil
        loading = true
        defer { loading = false }
        do {
            guard let presenter = topViewController() else {
                error = "Could not present sign-in UI."
                return
            }
            let user = try await MSALAuth.shared.signIn(presenter: presenter)
            auth.msUser = user

            // Exchange with server for an FA session.
            let req = PortalLoginRequest(
                email: user.email, phone: nil, sso: true, name: user.displayName, msToken: user.idToken
            )
            let resp = try await APIClient.shared.request(
                .portalLogin, as: PortalLoginResponse.self, body: req
            )
            auth.persistPortalLogin(resp)
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func topViewController() -> UIViewController? {
        let scene = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first { $0.activationState == .foregroundActive }
        var vc = scene?.keyWindow?.rootViewController
        while let presented = vc?.presentedViewController { vc = presented }
        return vc
    }
}
