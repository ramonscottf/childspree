import Foundation
import UIKit
#if canImport(MSAL)
import MSAL
#endif

/// Wrapper around the MSAL iOS SDK. Uses the same Azure AD tenant/client ID
/// as the web MSAL config in `src/App.jsx:7-10`.
///
/// Client ID: `ddf5d2a5-b2f2-4661-943f-c25fcc69833f`
/// Tenant:    `3d9cf274-547e-4af5-8dde-01a636e0b607`
/// Redirect:  `msauth.org.daviskids.childspree://auth`
@MainActor
final class MSALAuth {
    static let shared = MSALAuth()

    struct User: Equatable {
        let email: String
        let displayName: String
        let idToken: String
    }

    enum AuthError: Error, LocalizedError {
        case notConfigured
        case userCancelled
        case tokenMissing
        case other(String)
        var errorDescription: String? {
            switch self {
            case .notConfigured: return "MSAL is not configured"
            case .userCancelled: return "Sign-in cancelled"
            case .tokenMissing: return "Sign-in succeeded but no ID token was returned"
            case .other(let m): return m
            }
        }
    }

    static let clientId = "ddf5d2a5-b2f2-4661-943f-c25fcc69833f"
    static let tenantId = "3d9cf274-547e-4af5-8dde-01a636e0b607"
    static let scopes = ["openid", "profile", "email", "User.Read"]
    static let redirectURI = "msauth.org.daviskids.childspree://auth"

    #if canImport(MSAL)
    private var application: MSALPublicClientApplication?

    private func makeApp() throws -> MSALPublicClientApplication {
        if let app = application { return app }
        let authorityURL = URL(string: "https://login.microsoftonline.com/\(Self.tenantId)")!
        let authority = try MSALAADAuthority(url: authorityURL)
        let config = MSALPublicClientApplicationConfig(
            clientId: Self.clientId,
            redirectUri: Self.redirectURI,
            authority: authority
        )
        let app = try MSALPublicClientApplication(configuration: config)
        self.application = app
        return app
    }

    func signIn(presenter: UIViewController) async throws -> User {
        let app = try makeApp()
        let params = MSALInteractiveTokenParameters(
            scopes: Self.scopes,
            webviewParameters: MSALWebviewParameters(authPresentationViewController: presenter)
        )
        params.promptType = .selectAccount

        return try await withCheckedThrowingContinuation { continuation in
            app.acquireToken(with: params) { result, error in
                if let error {
                    continuation.resume(throwing: AuthError.other(error.localizedDescription))
                    return
                }
                guard let result else {
                    continuation.resume(throwing: AuthError.other("No result"))
                    return
                }
                let claims = result.account.accountClaims ?? [:]
                let email = (claims["preferred_username"] as? String)
                    ?? (claims["upn"] as? String)
                    ?? (claims["email"] as? String)
                    ?? result.account.username
                    ?? ""
                let name = (claims["name"] as? String) ?? result.account.username ?? email
                continuation.resume(returning: User(
                    email: email,
                    displayName: name,
                    idToken: result.idToken ?? ""
                ))
            }
        }
    }

    func signOut() {
        application = nil
        // Full sign-out (clearing MSAL accounts) is optional; we mirror web by
        // just dropping our session. Users can pick a different account on
        // next sign-in because we pass .selectAccount above.
    }

    func handleRedirect(url: URL, sourceApplication: String?) -> Bool {
        MSALPublicClientApplication.handleMSALResponse(url, sourceApplication: sourceApplication)
    }
    #else
    // MSAL SDK unavailable at compile time — all calls fail with notConfigured.
    func signIn(presenter: UIViewController) async throws -> User {
        throw AuthError.notConfigured
    }
    func signOut() {}
    func handleRedirect(url: URL, sourceApplication: String?) -> Bool { false }
    #endif
}
