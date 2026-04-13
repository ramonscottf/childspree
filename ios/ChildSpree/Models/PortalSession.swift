import Foundation

/// Response from `POST /api/portal/login` (`functions/api/portal/login.js`).
struct PortalLoginResponse: Decodable {
    let token: String
    let email: String
    let name: String?
    let school: String?
    let languages: [String]?
    let expiresAt: String?
}

struct PortalLoginRequest: Encodable {
    let email: String
    let phone: String?
    let sso: Bool
    let name: String?
    let msToken: String?
}

/// Response from `GET /api/portal/dashboard`.
struct PortalDashboardResponse: Decodable {
    let nominations: [Nomination]
    let stats: PortalStats
}

struct PortalStats: Decodable, Hashable {
    let total: Int
    let intakeComplete: Int
    let consented: Int?
    let needsVideo: Int
    let awaitingParent: Int
    let pending: Int
}

/// Response from `GET /api/auth/role`.
struct AuthRoleResponse: Decodable {
    let role: String // "admin" | "fa" | "unknown"
    let email: String
    let name: String?
    let school: String?
}

/// Body for `POST /api/portal/phone`.
struct RegisterPhoneRequest: Encodable {
    let phone: String
}
