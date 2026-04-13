import Foundation

/// Mirrors the JSON shape returned by `GET /api/nominations` in
/// `functions/api/nominations.js:40-54`.
struct Nomination: Identifiable, Decodable, Hashable {
    let id: String
    let status: String
    let parentToken: String?
    let childFirst: String
    let childLast: String
    let studentId: String?
    let school: String
    let grade: String
    let nominatorName: String
    let nominatorRole: String
    let nominatorEmail: String
    let parentName: String
    let parentPhone: String?
    let parentEmail: String?
    let reason: String?
    let siblingCount: Int
    let siblingNames: String?
    let additionalNotes: String?
    let parentLanguage: String
    let familyGroup: String?
    let createdAt: String
    let updatedAt: String
    let parentIntake: ParentIntake?

    var displayName: String { "\(childFirst) \(childLast)" }
    var hasVideo: Bool { parentIntake?.hasVideo ?? false }
    var hasIntake: Bool { parentIntake != nil }
}

struct NominationsResponse: Decodable {
    let nominations: [Nomination]
    let total: Int
}

/// Payload for `POST /api/nominations`. Required fields per
/// `functions/api/nominations.js:63-69`.
struct CreateNominationRequest: Encodable {
    let childFirst: String
    let childLast: String
    let studentId: String?
    let school: String
    let grade: String
    let nominatorName: String
    let nominatorRole: String
    let nominatorEmail: String
    let nominatorPhone: String?
    let parentName: String
    let parentPhone: String?
    let parentEmail: String?
    let reason: String?
    let siblingCount: Int
    let siblingNames: String?
    let siblingsData: String?
    let additionalNotes: String?
    let parentLanguage: String
}

struct CreateNominationResponse: Decodable {
    let id: String
    let parentToken: String
    let status: String
    let siblingIds: [String]?
}

/// Patch body for status transitions: pending → approved → sent → complete.
struct PatchNominationRequest: Encodable {
    let status: String?
    // Additional editable fields used by portal edit card.
    let childFirst: String?
    let childLast: String?
    let school: String?
    let grade: String?
    let parentName: String?
    let parentPhone: String?
    let parentEmail: String?
    let reason: String?
}
