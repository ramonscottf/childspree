import Foundation

/// Minimal multipart/form-data uploader for `/api/upload/:token`.
/// Matches web's FormData behavior in `src/App.jsx` `VideoCapture` / browser
/// `MediaRecorder` upload, and the server expects field name `video`.
enum MultipartUpload {
    struct Response: Decodable {
        let uploaded: Bool
        let key: String
    }

    struct UploadError: Error, LocalizedError {
        let message: String
        var errorDescription: String? { message }
    }

    static let maxBytes: Int = 50 * 1024 * 1024 // Server enforces 50MB

    static func uploadVideo(
        fileURL: URL,
        token: String,
        mimeType: String = "video/mp4"
    ) async throws -> Response {
        let data = try Data(contentsOf: fileURL)
        guard data.count <= maxBytes else {
            throw UploadError(message: "Video must be under 50MB")
        }

        let url = URL(string: "https://childspree.org/api/upload/\(token)")!
        let boundary = "cs-boundary-\(UUID().uuidString)"
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        let lf = "\r\n"
        let filename = fileURL.lastPathComponent
        body.append("--\(boundary)\(lf)".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"video\"; filename=\"\(filename)\"\(lf)".data(using: .utf8)!)
        body.append("Content-Type: \(mimeType)\(lf)\(lf)".data(using: .utf8)!)
        body.append(data)
        body.append("\(lf)--\(boundary)--\(lf)".data(using: .utf8)!)

        let (respData, response) = try await URLSession.shared.upload(for: req, from: body)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            let status = (response as? HTTPURLResponse)?.statusCode ?? -1
            let msg = String(data: respData, encoding: .utf8) ?? "HTTP \(status)"
            throw UploadError(message: msg)
        }

        return try JSONDecoder().decode(Response.self, from: respData)
    }
}
