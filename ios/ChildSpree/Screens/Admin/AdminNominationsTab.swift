import SwiftUI

/// Nominations list with filter, search, and pipeline actions.
/// Mirrors the nominations tab of `AdminDashboard` in `src/App.jsx`.
///
/// Status transitions: pending → approved → sent → complete (or declined).
struct AdminNominationsTab: View {
    @StateObject private var vm = AdminNomsVM()
    @State private var showExporter = false

    var body: some View {
        VStack(spacing: 0) {
            filterBar
            if let err = vm.error {
                Text(err).csBody(13).foregroundColor(CSColor.red).padding(CSSpacing.md)
            }
            list
        }
        .task { await vm.load() }
        .refreshable { await vm.load() }
        .sheet(isPresented: $showExporter) {
            if let url = vm.exportURL {
                ShareSheet(items: [url])
            }
        }
    }

    private var filterBar: some View {
        VStack(spacing: CSSpacing.sm) {
            HStack(spacing: CSSpacing.sm) {
                Image(systemName: "magnifyingglass").foregroundColor(CSColor.muted)
                TextField("Search name, school, email…", text: $vm.search)
                    .font(CSFont.body(14))
                    .autocorrectionDisabled(true)
                    .textInputAutocapitalization(.never)
                    .onSubmit { Task { await vm.load() } }
                if !vm.search.isEmpty {
                    Button { vm.search = ""; Task { await vm.load() } } label: {
                        Image(systemName: "xmark.circle.fill").foregroundColor(CSColor.light)
                    }
                }
            }
            .padding(.vertical, 10)
            .padding(.horizontal, 12)
            .background(Color(hex: 0xFAFBFC))
            .overlay(RoundedRectangle(cornerRadius: CSRadius.input).stroke(CSColor.border, lineWidth: 1.5))
            .cornerRadius(CSRadius.input)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: CSSpacing.xs) {
                    ForEach(AdminNomsVM.Filter.allCases) { f in
                        ChipButton(title: f.label, isSelected: vm.filter == f) {
                            vm.filter = f
                            Task { await vm.load() }
                        }
                    }
                    Spacer(minLength: CSSpacing.sm)
                    Button {
                        vm.exportCSV()
                        if vm.exportURL != nil { showExporter = true }
                    } label: {
                        Label("Export CSV", systemImage: "square.and.arrow.up")
                            .font(CSFont.body(12, weight: .semibold))
                            .foregroundColor(CSColor.navy)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(CSSpacing.md)
    }

    private var list: some View {
        ScrollView {
            LazyVStack(spacing: CSSpacing.sm) {
                if vm.loading {
                    ProgressView().padding(CSSpacing.xl)
                } else if vm.nominations.isEmpty {
                    Text("No nominations match the filter.")
                        .csBody(13)
                        .foregroundColor(CSColor.muted)
                        .padding(CSSpacing.xl)
                } else {
                    ForEach(vm.nominations) { nom in
                        NominationRow(nom: nom) { action in
                            Task { await vm.perform(action, on: nom) }
                        }
                    }
                }
            }
            .padding(.horizontal, CSSpacing.md)
            .padding(.bottom, CSSpacing.xl)
        }
    }
}

private struct NominationRow: View {
    let nom: Nomination
    let onAction: (AdminNomsVM.Action) -> Void

    @State private var expanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: CSSpacing.sm) {
            Button { withAnimation { expanded.toggle() } } label: {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(nom.displayName)
                            .font(CSFont.body(15, weight: .semibold))
                            .foregroundColor(CSColor.text)
                        Text("\(nom.school) · Grade \(nom.grade)")
                            .csBody(12)
                            .foregroundColor(CSColor.muted)
                    }
                    Spacer()
                    StatusBadge(status: nom.status)
                    Image(systemName: expanded ? "chevron.up" : "chevron.down")
                        .foregroundColor(CSColor.muted)
                }
            }
            .buttonStyle(.plain)

            if expanded {
                Divider().background(CSColor.border)
                detail("Nominator", "\(nom.nominatorName) (\(nom.nominatorRole))")
                detail("Email", nom.nominatorEmail)
                detail("Parent", nom.parentName)
                if let ph = nom.parentPhone, !ph.isEmpty { detail("Parent phone", ph) }
                if let em = nom.parentEmail, !em.isEmpty { detail("Parent email", em) }
                if let r = nom.reason, !r.isEmpty { detail("Reason", r) }
                if nom.siblingCount > 0, let names = nom.siblingNames {
                    detail("Siblings (\(nom.siblingCount))", names)
                }
                detail("Language", nom.parentLanguage)

                actionRow
            }
        }
        .padding(CSSpacing.md)
        .background(CSColor.card)
        .overlay(RoundedRectangle(cornerRadius: CSRadius.card).stroke(CSColor.border, lineWidth: 1))
        .cornerRadius(CSRadius.card)
    }

    @ViewBuilder
    private func detail(_ label: String, _ value: String) -> some View {
        HStack(alignment: .top) {
            Text(label)
                .csBody(12, weight: .semibold)
                .foregroundColor(CSColor.muted)
                .frame(width: 110, alignment: .leading)
            Text(value)
                .csBody(13)
                .foregroundColor(CSColor.text)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var actionRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: CSSpacing.xs) {
                switch nom.status {
                case "pending":
                    actionBtn("Approve", tint: CSColor.green) { onAction(.setStatus("approved")) }
                    actionBtn("Decline", tint: CSColor.red) { onAction(.setStatus("declined")) }
                case "approved":
                    actionBtn("Send Intake", tint: CSColor.blue) { onAction(.setStatus("sent")) }
                case "sent":
                    actionBtn("Mark Complete", tint: CSColor.green) { onAction(.setStatus("complete")) }
                    actionBtn("Remind", tint: CSColor.amber) { onAction(.remind) }
                default:
                    EmptyView()
                }
            }
        }
    }

    @ViewBuilder
    private func actionBtn(_ title: String, tint: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(CSFont.body(12, weight: .semibold))
                .foregroundColor(.white)
                .padding(.vertical, 8)
                .padding(.horizontal, 14)
                .background(tint)
                .cornerRadius(CSRadius.button)
        }
        .buttonStyle(.plain)
    }
}

@MainActor
final class AdminNomsVM: ObservableObject {
    @Published var nominations: [Nomination] = []
    @Published var search: String = ""
    @Published var filter: Filter = .all
    @Published var loading = false
    @Published var error: String?
    @Published var exportURL: URL?

    enum Filter: String, CaseIterable, Identifiable {
        case all, pending, approved, sent, complete, declined
        var id: String { rawValue }
        var label: String { rawValue.capitalized }
        var apiValue: String? { self == .all ? nil : rawValue }
    }

    enum Action {
        case setStatus(String)
        case remind
    }

    func load() async {
        loading = true
        error = nil
        defer { loading = false }
        do {
            let resp = try await APIClient.shared.request(
                .listNominations(status: filter.apiValue, search: search),
                as: NominationsResponse.self
            )
            self.nominations = resp.nominations
        } catch {
            self.error = error.localizedDescription
        }
    }

    func perform(_ action: Action, on nom: Nomination) async {
        do {
            switch action {
            case .setStatus(let s):
                let body = PatchNominationRequest(
                    status: s, childFirst: nil, childLast: nil,
                    school: nil, grade: nil, parentName: nil,
                    parentPhone: nil, parentEmail: nil, reason: nil
                )
                try await APIClient.shared.requestVoid(
                    .nomination(id: nom.id, method: .PATCH), body: body
                )
            case .remind:
                try await APIClient.shared.requestVoid(.remindNomination(id: nom.id))
            }
            await load()
        } catch {
            self.error = error.localizedDescription
        }
    }

    func exportCSV() {
        let headers = [
            "ID", "Status", "Child First", "Child Last", "Student ID",
            "School", "Grade", "Nominator Name", "Nominator Role",
            "Nominator Email", "Parent Name", "Parent Phone", "Parent Email",
            "Reason", "Sibling Count", "Sibling Names", "Language", "Created"
        ]
        var rows = [headers.joined(separator: ",")]
        for n in nominations {
            let cols: [String] = [
                n.id, n.status, n.childFirst, n.childLast, n.studentId ?? "",
                n.school, n.grade, n.nominatorName, n.nominatorRole,
                n.nominatorEmail, n.parentName, n.parentPhone ?? "",
                n.parentEmail ?? "", n.reason ?? "", "\(n.siblingCount)",
                n.siblingNames ?? "", n.parentLanguage, n.createdAt
            ].map(CSVEscape.quote)
            rows.append(cols.joined(separator: ","))
        }
        let csv = rows.joined(separator: "\n")
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("nominations-\(Int(Date().timeIntervalSince1970)).csv")
        try? csv.data(using: .utf8)?.write(to: url)
        self.exportURL = url
    }
}

enum CSVEscape {
    static func quote(_ v: String) -> String {
        let needs = v.contains(",") || v.contains("\"") || v.contains("\n")
        let inner = v.replacingOccurrences(of: "\"", with: "\"\"")
        return needs ? "\"\(inner)\"" : inner
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
