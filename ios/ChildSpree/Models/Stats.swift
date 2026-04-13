import Foundation

/// Response shape for `GET /api/stats` — admin dashboard.
/// See `functions/api/stats.js` for exact server output.
struct AdminStats: Decodable {
    let total: Int
    let byStatus: [String: Int]
    let bySchool: [SchoolCount]
    let recent: [RecentNomination]

    struct SchoolCount: Decodable, Hashable {
        let school: String
        let count: Int
    }

    struct RecentNomination: Decodable, Hashable, Identifiable {
        let id: String
        let childFirst: String
        let childLast: String
        let school: String
        let status: String
        let createdAt: String
    }
}
