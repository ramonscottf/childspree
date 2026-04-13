import Foundation

/// Shared networking client for the Child Spree Cloudflare Workers API.
/// All routes live at `https://childspree.org/api/*` — identical contract to web.
actor APIClient {
    static let shared = APIClient()

    private let baseURL = URL(string: "https://childspree.org")!
    private let session: URLSession

    init(session: URLSession = .shared) {
        self.session = session
    }

    // MARK: - Error

    struct APIError: Error, LocalizedError {
        let statusCode: Int
        let message: String
        var errorDescription: String? { message }
    }

    // MARK: - JSON request

    func request<T: Decodable>(
        _ endpoint: Endpoint,
        as type: T.Type,
        body: Encodable? = nil,
        headers: [String: String] = [:]
    ) async throws -> T {
        let data = try await requestData(endpoint, body: body, headers: headers)
        do {
            return try JSONDecoder.cs.decode(T.self, from: data)
        } catch {
            throw APIError(
                statusCode: -1,
                message: "Decode failed: \(error.localizedDescription)"
            )
        }
    }

    /// Void variant for endpoints where we don't need the body.
    func requestVoid(
        _ endpoint: Endpoint,
        body: Encodable? = nil,
        headers: [String: String] = [:]
    ) async throws {
        _ = try await requestData(endpoint, body: body, headers: headers)
    }

    private func requestData(
        _ endpoint: Endpoint,
        body: Encodable? = nil,
        headers: [String: String] = [:]
    ) async throws -> Data {
        let url = baseURL.appendingPathComponent(endpoint.path)
        var components = URLComponents(url: url, resolvingAgainstBaseURL: false)!
        if !endpoint.query.isEmpty {
            components.queryItems = endpoint.query.map { URLQueryItem(name: $0.key, value: $0.value) }
        }

        var req = URLRequest(url: components.url!)
        req.httpMethod = endpoint.method.rawValue
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        for (k, v) in headers { req.setValue(v, forHTTPHeaderField: k) }

        if let body {
            req.httpBody = try JSONEncoder.cs.encode(AnyEncodable(body))
        }

        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse else {
            throw APIError(statusCode: -1, message: "Invalid response")
        }

        if !(200..<300).contains(http.statusCode) {
            let msg = (try? JSONDecoder.cs.decode(ErrorResponse.self, from: data))?.error
                ?? "HTTP \(http.statusCode)"
            throw APIError(statusCode: http.statusCode, message: msg)
        }
        return data
    }

    private struct ErrorResponse: Decodable { let error: String }
}

// MARK: - Coding helpers

private struct AnyEncodable: Encodable {
    let wrapped: Encodable
    init(_ w: Encodable) { self.wrapped = w }
    func encode(to encoder: Encoder) throws { try wrapped.encode(to: encoder) }
}

extension JSONEncoder {
    static var cs: JSONEncoder {
        let e = JSONEncoder()
        e.keyEncodingStrategy = .useDefaultKeys
        return e
    }
}

extension JSONDecoder {
    static var cs: JSONDecoder {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .useDefaultKeys
        return d
    }
}
