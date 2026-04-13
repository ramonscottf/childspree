import Foundation

enum HTTPMethod: String { case GET, POST, PATCH, DELETE, OPTIONS }

/// Strongly-typed endpoint descriptor. One case per backend route.
struct Endpoint {
    let method: HTTPMethod
    let path: String
    var query: [String: String] = [:]

    // MARK: - Public

    /// POST /api/nominations — create nomination
    static let createNomination = Endpoint(method: .POST, path: "api/nominations")

    /// GET /api/nominations — admin list
    static func listNominations(status: String? = nil, search: String? = nil) -> Endpoint {
        var q: [String: String] = [:]
        if let status, status != "all" { q["status"] = status }
        if let search, !search.isEmpty { q["search"] = search }
        return Endpoint(method: .GET, path: "api/nominations", query: q)
    }

    /// GET/PATCH /api/nominations/:id
    static func nomination(id: String, method: HTTPMethod = .GET) -> Endpoint {
        Endpoint(method: method, path: "api/nominations/\(id)")
    }

    /// POST /api/nominations/:id/remind
    static func remindNomination(id: String) -> Endpoint {
        Endpoint(method: .POST, path: "api/nominations/\(id)/remind")
    }

    /// GET/POST /api/intake/:token
    static func intake(token: String, method: HTTPMethod = .GET) -> Endpoint {
        Endpoint(method: method, path: "api/intake/\(token)")
    }

    /// POST /api/upload/:token (multipart — handled by MultipartUpload)
    static func uploadVideo(token: String) -> Endpoint {
        Endpoint(method: .POST, path: "api/upload/\(token)")
    }

    // MARK: - Portal (Family Advocate)

    static let portalLogin = Endpoint(method: .POST, path: "api/portal/login")
    static let portalDashboard = Endpoint(method: .GET, path: "api/portal/dashboard")
    static let portalPhoneGet = Endpoint(method: .GET, path: "api/portal/phone")
    static let portalPhonePost = Endpoint(method: .POST, path: "api/portal/phone")

    static func portalNomination(id: String, method: HTTPMethod = .GET) -> Endpoint {
        Endpoint(method: method, path: "api/portal/nomination/\(id)")
    }

    static func faVideo(nominationId: String) -> Endpoint {
        Endpoint(method: .POST, path: "api/fa/video/\(nominationId)")
    }

    // MARK: - Admin

    /// GET /api/volunteers — admin list
    static func listVolunteers(status: String? = nil, search: String? = nil) -> Endpoint {
        var q: [String: String] = [:]
        if let status, status != "all" { q["status"] = status }
        if let search, !search.isEmpty { q["search"] = search }
        return Endpoint(method: .GET, path: "api/volunteers", query: q)
    }
    static let createVolunteer = Endpoint(method: .POST, path: "api/volunteers")
    static func volunteer(id: String) -> Endpoint {
        Endpoint(method: .PATCH, path: "api/volunteers/\(id)")
    }
    static let messageVolunteers = Endpoint(method: .POST, path: "api/volunteers/message")

    /// GET/POST /api/fa — manage Family Advocates
    static let listAdvocates = Endpoint(method: .GET, path: "api/fa")
    static let createAdvocate = Endpoint(method: .POST, path: "api/fa")

    /// GET /api/stats — admin stats
    static let stats = Endpoint(method: .GET, path: "api/stats")

    /// GET /api/auth/role?email=...
    static func authRole(email: String) -> Endpoint {
        Endpoint(method: .GET, path: "api/auth/role", query: ["email": email])
    }
}
