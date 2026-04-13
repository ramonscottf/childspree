import XCTest
@testable import ChildSpree

/// Tests the declarative endpoint metadata: URL construction, HTTP method,
/// query string assembly. Network round-trips aren't covered here — those
/// are exercised manually against the production API per the plan.
final class APIClientTests: XCTestCase {
    func testCreateNominationEndpoint() {
        let ep = Endpoint.createNomination
        XCTAssertEqual(ep.method, .POST)
        XCTAssertEqual(ep.path, "api/nominations")
        XCTAssertTrue(ep.query.isEmpty)
    }

    func testListNominationsWithFilterAndSearch() {
        let ep = Endpoint.listNominations(status: "pending", search: "Ava")
        XCTAssertEqual(ep.method, .GET)
        XCTAssertEqual(ep.path, "api/nominations")
        XCTAssertEqual(ep.query["status"], "pending")
        XCTAssertEqual(ep.query["search"], "Ava")
    }

    func testListNominationsDropsAllFilter() {
        let ep = Endpoint.listNominations(status: "all", search: nil)
        XCTAssertNil(ep.query["status"])
        XCTAssertNil(ep.query["search"])
    }

    func testIntakeByTokenGet() {
        let ep = Endpoint.intake(token: "tok_abc")
        XCTAssertEqual(ep.method, .GET)
        XCTAssertEqual(ep.path, "api/intake/tok_abc")
    }

    func testIntakeByTokenPost() {
        let ep = Endpoint.intake(token: "tok_abc", method: .POST)
        XCTAssertEqual(ep.method, .POST)
        XCTAssertEqual(ep.path, "api/intake/tok_abc")
    }

    func testUploadEndpoint() {
        let ep = Endpoint.uploadVideo(token: "tok_up")
        XCTAssertEqual(ep.method, .POST)
        XCTAssertEqual(ep.path, "api/upload/tok_up")
    }

    func testPortalNominationPatch() {
        let ep = Endpoint.portalNomination(id: "nom_1", method: .PATCH)
        XCTAssertEqual(ep.method, .PATCH)
        XCTAssertEqual(ep.path, "api/portal/nomination/nom_1")
    }

    func testFAVideoEndpoint() {
        let ep = Endpoint.faVideo(nominationId: "nom_9")
        XCTAssertEqual(ep.method, .POST)
        XCTAssertEqual(ep.path, "api/fa/video/nom_9")
    }

    func testRemindNominationEndpoint() {
        let ep = Endpoint.remindNomination(id: "nom_2")
        XCTAssertEqual(ep.method, .POST)
        XCTAssertEqual(ep.path, "api/nominations/nom_2/remind")
    }

    func testAuthRoleQuery() {
        let ep = Endpoint.authRole(email: "user@dsdmail.net")
        XCTAssertEqual(ep.query["email"], "user@dsdmail.net")
    }

    // MARK: - CSV escaping

    func testCSVEscapeBasic() {
        XCTAssertEqual(CSVEscape.quote("Hello"), "Hello")
    }

    func testCSVEscapeCommaAndQuote() {
        XCTAssertEqual(CSVEscape.quote("Hello, \"world\""), "\"Hello, \"\"world\"\"\"")
    }
}
