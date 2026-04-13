import Foundation

struct Volunteer: Identifiable, Decodable, Hashable {
    let id: String
    let status: String
    let firstName: String
    let lastName: String
    let email: String
    let phone: String?
    let organization: String?
    let groupType: String?
    let shirtSize: String?
    let storeLocation: String?
    let arrivalTime: String?
    let earlyArrival: Int?
    let experience: String?
    let hearAbout: String?
    let smsOptIn: Int?
    let createdAt: String

    var displayName: String { "\(firstName) \(lastName)" }
}

struct VolunteersResponse: Decodable {
    let volunteers: [Volunteer]
    let total: Int
}

struct CreateVolunteerRequest: Encodable {
    let firstName: String
    let lastName: String
    let email: String
    let phone: String
    let organization: String?
    let groupType: String?
    let shirtSize: String
    let storeLocation: String
    let arrivalTime: String
    let earlyArrival: Bool
    let experience: String?
    let hearAbout: String?
    let smsOptIn: Bool
}
