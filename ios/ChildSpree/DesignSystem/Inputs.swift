import SwiftUI

/// Text field mirroring the `inp()` style from App.jsx:321.
struct CSTextField: View {
    let label: String?
    @Binding var text: String
    var placeholder: String = ""
    var keyboard: UIKeyboardType = .default
    var autocap: TextInputAutocapitalization = .sentences

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            if let label {
                Text(label)
                    .font(CSFont.body(12, weight: .semibold))
                    .foregroundColor(CSColor.muted)
                    .tracking(0.3)
            }
            TextField(placeholder, text: $text)
                .font(CSFont.body(14))
                .keyboardType(keyboard)
                .textInputAutocapitalization(autocap)
                .autocorrectionDisabled(keyboard == .emailAddress)
                .padding(.vertical, 10)
                .padding(.horizontal, 12)
                .background(Color(hex: 0xFAFBFC))
                .overlay(
                    RoundedRectangle(cornerRadius: CSRadius.input)
                        .stroke(CSColor.border, lineWidth: 1.5)
                )
                .cornerRadius(CSRadius.input)
        }
        .padding(.bottom, 14)
    }
}

/// Multiline text editor with the same visual treatment.
struct CSTextEditor: View {
    let label: String?
    @Binding var text: String
    var minHeight: CGFloat = 80
    var placeholder: String = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            if let label {
                Text(label)
                    .font(CSFont.body(12, weight: .semibold))
                    .foregroundColor(CSColor.muted)
                    .tracking(0.3)
            }
            ZStack(alignment: .topLeading) {
                if text.isEmpty {
                    Text(placeholder)
                        .font(CSFont.body(14))
                        .foregroundColor(CSColor.light)
                        .padding(.top, 12)
                        .padding(.leading, 14)
                        .allowsHitTesting(false)
                }
                TextEditor(text: $text)
                    .font(CSFont.body(14))
                    .frame(minHeight: minHeight)
                    .padding(6)
                    .scrollContentBackground(.hidden)
                    .background(Color(hex: 0xFAFBFC))
            }
            .overlay(
                RoundedRectangle(cornerRadius: CSRadius.input)
                    .stroke(CSColor.border, lineWidth: 1.5)
            )
            .cornerRadius(CSRadius.input)
        }
        .padding(.bottom, 14)
    }
}

/// Picker menu matching the dropdown style in web.
struct CSPicker<T: Hashable & Identifiable>: View {
    let label: String?
    let options: [T]
    @Binding var selection: T?
    let display: (T) -> String
    var placeholder: String = "Select..."

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            if let label {
                Text(label)
                    .font(CSFont.body(12, weight: .semibold))
                    .foregroundColor(CSColor.muted)
                    .tracking(0.3)
            }
            Menu {
                ForEach(options) { opt in
                    Button(display(opt)) { selection = opt }
                }
            } label: {
                HStack {
                    Text(selection.map(display) ?? placeholder)
                        .font(CSFont.body(14))
                        .foregroundColor(selection == nil ? CSColor.light : CSColor.text)
                    Spacer()
                    Image(systemName: "chevron.down")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(CSColor.muted)
                }
                .padding(.vertical, 10)
                .padding(.horizontal, 12)
                .background(Color(hex: 0xFAFBFC))
                .overlay(
                    RoundedRectangle(cornerRadius: CSRadius.input)
                        .stroke(CSColor.border, lineWidth: 1.5)
                )
                .cornerRadius(CSRadius.input)
            }
        }
        .padding(.bottom, 14)
    }
}

/// String picker convenience (many of our pickers are just strings).
struct CSStringPicker: View {
    let label: String?
    let options: [String]
    @Binding var selection: String
    var placeholder: String = "Select..."

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            if let label {
                Text(label)
                    .font(CSFont.body(12, weight: .semibold))
                    .foregroundColor(CSColor.muted)
                    .tracking(0.3)
            }
            Menu {
                ForEach(options, id: \.self) { opt in
                    Button(opt) { selection = opt }
                }
            } label: {
                HStack {
                    Text(selection.isEmpty ? placeholder : selection)
                        .font(CSFont.body(14))
                        .foregroundColor(selection.isEmpty ? CSColor.light : CSColor.text)
                    Spacer()
                    Image(systemName: "chevron.down")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(CSColor.muted)
                }
                .padding(.vertical, 10)
                .padding(.horizontal, 12)
                .background(Color(hex: 0xFAFBFC))
                .overlay(
                    RoundedRectangle(cornerRadius: CSRadius.input)
                        .stroke(CSColor.border, lineWidth: 1.5)
                )
                .cornerRadius(CSRadius.input)
            }
        }
        .padding(.bottom, 14)
    }
}

/// Card container used for form sections and dashboard tiles.
struct CSCard<Content: View>: View {
    let content: Content
    var padding: CGFloat = 20

    init(padding: CGFloat = 20, @ViewBuilder content: () -> Content) {
        self.padding = padding
        self.content = content()
    }

    var body: some View {
        content
            .padding(padding)
            .background(CSColor.card)
            .overlay(
                RoundedRectangle(cornerRadius: CSRadius.card)
                    .stroke(CSColor.border, lineWidth: 1)
            )
            .cornerRadius(CSRadius.card)
    }
}

/// Section header with pink-light underline — matches `secHead` in App.jsx:323.
struct CSSectionHeader: View {
    let text: String
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(text.uppercased())
                .font(CSFont.body(11, weight: .bold))
                .foregroundColor(CSColor.navy)
                .tracking(1.2)
            Rectangle()
                .fill(CSColor.pinkLight)
                .frame(height: 2)
        }
        .padding(.bottom, 12)
    }
}
