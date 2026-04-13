import XCTest
@testable import ChildSpree

/// Decodes representative JSON payloads for each Codable model to catch
/// drift between iOS and the Workers API (`functions/api/*`). Payloads are
/// hand-crafted to match the server's actual response shape — if the server
/// changes we want these to fail loudly.
final class ModelDecodingTests: XCTestCase {
    private var decoder: JSONDecoder { JSONDecoder.cs }

    // MARK: - Nomination

    func testDecodeNominationsListResponse() throws {
        let json = """
        {
          "nominations": [
            {
              "id": "nom_1",
              "status": "pending",
              "parentToken": "tok_abc",
              "childFirst": "Ava",
              "childLast": "Nguyen",
              "studentId": "123456",
              "school": "Davis Elementary",
              "grade": "3rd",
              "nominatorName": "Ms. Perez",
              "nominatorRole": "Teacher",
              "nominatorEmail": "perez@dsdmail.net",
              "parentName": "Hannah Nguyen",
              "parentPhone": "8015551212",
              "parentEmail": "hannah@example.com",
              "reason": "Needs shoes for winter.",
              "siblingCount": 1,
              "siblingNames": "Leo Nguyen",
              "additionalNotes": null,
              "parentLanguage": "en",
              "familyGroup": "fam_xyz",
              "createdAt": "2026-04-10T12:00:00Z",
              "updatedAt": "2026-04-10T12:00:00Z",
              "parentIntake": null
            }
          ],
          "total": 1
        }
        """.data(using: .utf8)!

        let resp = try decoder.decode(NominationsResponse.self, from: json)
        XCTAssertEqual(resp.total, 1)
        XCTAssertEqual(resp.nominations.first?.displayName, "Ava Nguyen")
        XCTAssertFalse(resp.nominations.first?.hasIntake ?? true)
    }

    // MARK: - Parent intake

    func testDecodeIntakeFetchResponse() throws {
        let json = """
        {
          "childFirst": "Leo",
          "childLast": "Nguyen",
          "school": "Davis Elementary",
          "grade": "1st",
          "alreadySubmitted": false,
          "parentLanguage": "es"
        }
        """.data(using: .utf8)!

        let resp = try decoder.decode(IntakeFetchResponse.self, from: json)
        XCTAssertEqual(resp.parentLanguage, "es")
        XCTAssertFalse(resp.alreadySubmitted)
    }

    // MARK: - Portal

    func testDecodePortalLoginResponse() throws {
        let json = """
        {
          "token": "fa_tok_123",
          "email": "fa@dsdmail.net",
          "name": "Jordan Smith",
          "school": "Davis Elementary",
          "languages": ["en"],
          "expiresAt": "2026-04-20T00:00:00Z"
        }
        """.data(using: .utf8)!
        let resp = try decoder.decode(PortalLoginResponse.self, from: json)
        XCTAssertEqual(resp.token, "fa_tok_123")
        XCTAssertEqual(resp.school, "Davis Elementary")
    }

    func testDecodePortalDashboardResponse() throws {
        let json = """
        {
          "nominations": [],
          "stats": {
            "total": 5,
            "intakeComplete": 3,
            "consented": 3,
            "needsVideo": 2,
            "awaitingParent": 1,
            "pending": 1
          }
        }
        """.data(using: .utf8)!
        let resp = try decoder.decode(PortalDashboardResponse.self, from: json)
        XCTAssertEqual(resp.stats.total, 5)
        XCTAssertEqual(resp.stats.needsVideo, 2)
    }

    // MARK: - Volunteer

    func testDecodeVolunteersResponse() throws {
        let json = """
        {
          "volunteers": [
            {
              "id": "vol_1",
              "status": "registered",
              "firstName": "Sam",
              "lastName": "Lee",
              "email": "sam@example.com",
              "phone": "8015550001",
              "organization": "Latter-day Saints Ward",
              "groupType": "church",
              "shirtSize": "M",
              "storeLocation": "Burlington Layton",
              "arrivalTime": "7:30 AM",
              "earlyArrival": 0,
              "experience": null,
              "hearAbout": "friend",
              "smsOptIn": 1,
              "createdAt": "2026-04-01T00:00:00Z"
            }
          ],
          "total": 1
        }
        """.data(using: .utf8)!
        let resp = try decoder.decode(VolunteersResponse.self, from: json)
        XCTAssertEqual(resp.volunteers.first?.shirtSize, "M")
    }

    // MARK: - Stats

    func testDecodeAdminStats() throws {
        let json = """
        {
          "total": 42,
          "byStatus": { "pending": 10, "approved": 20, "sent": 8, "complete": 4 },
          "bySchool": [
            { "school": "Davis Elementary", "count": 12 },
            { "school": "Kaysville Elementary", "count": 7 }
          ],
          "recent": [
            { "id": "nom_9", "childFirst": "Ava", "childLast": "N",
              "school": "Davis", "status": "pending",
              "createdAt": "2026-04-10T12:00:00Z" }
          ]
        }
        """.data(using: .utf8)!
        let stats = try decoder.decode(AdminStats.self, from: json)
        XCTAssertEqual(stats.total, 42)
        XCTAssertEqual(stats.byStatus["approved"], 20)
        XCTAssertEqual(stats.bySchool.count, 2)
    }

    // MARK: - Auth role

    func testDecodeAuthRole() throws {
        let json = """
        { "role": "fa", "email": "x@dsdmail.net", "name": "X", "school": "Davis Elementary" }
        """.data(using: .utf8)!
        let r = try decoder.decode(AuthRoleResponse.self, from: json)
        XCTAssertEqual(r.role, "fa")
    }
}
