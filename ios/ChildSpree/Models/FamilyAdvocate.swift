import Foundation

struct FamilyAdvocate: Identifiable, Decodable, Hashable {
    let id: String
    let firstName: String
    let lastName: String
    let email: String
    let phone: String?
    let school: String?
    let status: String?
    let notes: String?
    let nominationCount: Int?
    let createdAt: String

    var displayName: String { "\(firstName) \(lastName)" }
}

struct FamilyAdvocatesResponse: Decodable {
    let advocates: [FamilyAdvocate]
    let total: Int
}

struct CreateAdvocateRequest: Encodable {
    let firstName: String
    let lastName: String
    let email: String
    let phone: String?
    let school: String?
    let notes: String?
}
