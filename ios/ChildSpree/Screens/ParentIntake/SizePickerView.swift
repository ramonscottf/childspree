import SwiftUI

/// Scrolling wheel-style picker for sizes with many options. Falls back to the
/// standard menu picker for a friendlier touch experience.
struct SizePickerView: View {
    let label: String
    let options: [String]
    @Binding var selection: String

    var body: some View {
        CSStringPicker(label: label, options: options, selection: $selection)
    }
}
