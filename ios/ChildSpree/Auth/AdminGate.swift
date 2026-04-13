import SwiftUI

/// Simple password gate — mirrors the web admin password flow.
/// Password matches `src/App.jsx` admin logic ("childspree2026").
struct AdminGate: View {
    @EnvironmentObject var auth: AuthStore
    @State private var password: String = ""
    @State private var error: String?
    @State private var shake = false

    var body: some View {
        ZStack {
            CSColor.bg.ignoresSafeArea()
            VStack(spacing: CSSpacing.lg) {
                Spacer()
                VStack(spacing: CSSpacing.sm) {
                    Image(systemName: "lock.fill")
                        .font(.system(size: 36))
                        .foregroundColor(CSColor.navy)
                    Text("Admin")
                        .csDisplay(28)
                        .foregroundColor(CSColor.navy)
                    Text("Enter admin password to continue.")
                        .csBody(14)
                        .foregroundColor(CSColor.muted)
                }
                .padding(.bottom, CSSpacing.md)

                CSCard {
                    VStack(alignment: .leading, spacing: 0) {
                        SecureField("Password", text: $password)
                            .textContentType(.password)
                            .submitLabel(.go)
                            .onSubmit(attempt)
                            .padding(.vertical, 10)
                            .padding(.horizontal, 12)
                            .background(Color(hex: 0xFAFBFC))
                            .overlay(
                                RoundedRectangle(cornerRadius: CSRadius.input)
                                    .stroke(CSColor.border, lineWidth: 1.5)
                            )
                            .cornerRadius(CSRadius.input)
                        if let error {
                            Text(error)
                                .csBody(13)
                                .foregroundColor(CSColor.red)
                                .padding(.top, CSSpacing.sm)
                        }
                    }
                }
                .padding(.horizontal, CSSpacing.lg)
                .offset(x: shake ? -10 : 0)
                .animation(.default.repeatCount(3, autoreverses: true), value: shake)

                PinkButton(title: "Unlock") { attempt() }
                    .padding(.horizontal, CSSpacing.lg)
                Spacer()
                Spacer()
            }
        }
    }

    private func attempt() {
        if auth.unlockAdmin(password) {
            error = nil
        } else {
            error = "Incorrect password."
            shake.toggle()
        }
    }
}
