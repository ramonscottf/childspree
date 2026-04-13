import Foundation
import Security

/// Observable session state for the Family Advocate portal + admin gate.
/// Stores the FA token in Keychain (7-day TTL per server) — matches web's
/// sessionStorage-style behavior but backed by iOS secure storage.
@MainActor
final class AuthStore: ObservableObject {
    // MARK: - FA Portal session

    @Published var faToken: String?
    @Published var faEmail: String?
    @Published var faName: String?
    @Published var faSchool: String?

    // MARK: - Microsoft SSO user

    @Published var msUser: MSALAuth.User?

    // MARK: - Admin gate

    @Published var adminUnlocked: Bool = false
    static let adminPassword = "childspree2026"

    init() {
        self.faToken = Keychain.get(.faToken)
        self.faEmail = UserDefaults.standard.string(forKey: "cs-fa-email")
        self.faName = UserDefaults.standard.string(forKey: "cs-fa-name")
        self.faSchool = UserDefaults.standard.string(forKey: "cs-fa-school")
    }

    // MARK: - Portal login handling

    func persistPortalLogin(_ resp: PortalLoginResponse) {
        self.faToken = resp.token
        self.faEmail = resp.email
        self.faName = resp.name
        self.faSchool = resp.school
        Keychain.set(resp.token, for: .faToken)
        UserDefaults.standard.set(resp.email, forKey: "cs-fa-email")
        UserDefaults.standard.set(resp.name, forKey: "cs-fa-name")
        UserDefaults.standard.set(resp.school, forKey: "cs-fa-school")
    }

    func signOutFA() {
        faToken = nil
        faEmail = nil
        faName = nil
        faSchool = nil
        Keychain.delete(.faToken)
        UserDefaults.standard.removeObject(forKey: "cs-fa-email")
        UserDefaults.standard.removeObject(forKey: "cs-fa-name")
        UserDefaults.standard.removeObject(forKey: "cs-fa-school")
    }

    // MARK: - Admin

    func unlockAdmin(_ password: String) -> Bool {
        if password == Self.adminPassword {
            adminUnlocked = true
            return true
        }
        return false
    }

    func lockAdmin() { adminUnlocked = false }

    // MARK: - Authenticated headers helper

    var portalHeaders: [String: String] {
        guard let faToken else { return [:] }
        return ["X-FA-Token": faToken]
    }
}

// MARK: - Keychain helper

enum KeychainItem: String {
    case faToken = "cs.fa.token"
}

enum Keychain {
    static func set(_ value: String, for item: KeychainItem) {
        guard let data = value.data(using: .utf8) else { return }
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: item.rawValue,
        ]
        SecItemDelete(query as CFDictionary)
        var attrs = query
        attrs[kSecValueData as String] = data
        attrs[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        SecItemAdd(attrs as CFDictionary, nil)
    }

    static func get(_ item: KeychainItem) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: item.rawValue,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var result: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data,
              let s = String(data: data, encoding: .utf8) else { return nil }
        return s
    }

    static func delete(_ item: KeychainItem) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: item.rawValue,
        ]
        SecItemDelete(query as CFDictionary)
    }
}
