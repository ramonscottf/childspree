import Foundation

/// Embedded intake shape on a nomination — mirrors `parentIntake` in
/// `functions/api/nominations.js:48-53` and `/api/intake/:token`.
struct ParentIntake: Decodable, Hashable {
    let shirtSize: String?
    let pantSize: String?
    let shoeSize: String?
    let favoriteColors: String?
    let avoidColors: String?
    let allergies: String?
    let preferences: String?
    let hasVideo: Bool
    let childAge: String?
}

/// Response to `GET /api/intake/:token`.
struct IntakeFetchResponse: Decodable {
    let childFirst: String
    let childLast: String
    let school: String
    let grade: String
    let alreadySubmitted: Bool
    let parentLanguage: String
}

/// Body for `POST /api/intake/:token`.
struct IntakeSubmitRequest: Encodable {
    let shirtSize: String
    let pantSize: String
    let shoeSize: String
    let gender: String?
    let department: String?
    let favoriteColors: String?
    let avoidColors: String?
    let allergies: String?
    let preferences: String?
    let parentConsent: Bool
    let language: String
    let childAge: String?
}
