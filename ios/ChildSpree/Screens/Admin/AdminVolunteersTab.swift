import SwiftUI

/// Volunteer list — mirrors the volunteers tab of `AdminDashboard`.
struct AdminVolunteersTab: View {
    @StateObject private var vm = AdminVolunteersVM()
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
            if let url = vm.exportURL { ShareSheet(items: [url]) }
        }
    }

    private var filterBar: some View {
        VStack(spacing: CSSpacing.sm) {
            HStack {
                Image(systemName: "magnifyingglass").foregroundColor(CSColor.muted)
                TextField("Search name, email, organization…", text: $vm.search)
                    .font(CSFont.body(14))
                    .autocorrectionDisabled(true)
                    .textInputAutocapitalization(.never)
                    .onSubmit { Task { await vm.load() } }
            }
            .padding(.vertical, 10)
            .padding(.horizontal, 12)
            .background(Color(hex: 0xFAFBFC))
            .overlay(RoundedRectangle(cornerRadius: CSRadius.input).stroke(CSColor.border, lineWidth: 1.5))
            .cornerRadius(CSRadius.input)

            HStack {
                Text("\(vm.volunteers.count) volunteers")
                    .csBody(12)
                    .foregroundColor(CSColor.muted)
                Spacer()
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
        .padding(CSSpacing.md)
    }

    private var list: some View {
        ScrollView {
            LazyVStack(spacing: CSSpacing.sm) {
                if vm.loading {
                    ProgressView().padding(CSSpacing.xl)
                } else if vm.volunteers.isEmpty {
                    Text("No volunteers yet.")
                        .csBody(13)
                        .foregroundColor(CSColor.muted)
                        .padding(CSSpacing.xl)
                } else {
                    ForEach(vm.volunteers) { v in
                        VolunteerRow(volunteer: v) { status in
                            Task { await vm.updateStatus(v, status: status) }
                        }
                    }
                }
            }
            .padding(.horizontal, CSSpacing.md)
            .padding(.bottom, CSSpacing.xl)
        }
    }
}

private struct VolunteerRow: View {
    let volunteer: Volunteer
    let onSetStatus: (String) -> Void
    @State private var expanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: CSSpacing.sm) {
            Button { withAnimation { expanded.toggle() } } label: {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(volunteer.displayName)
                            .font(CSFont.body(15, weight: .semibold))
                            .foregroundColor(CSColor.text)
                        Text(volunteer.email).csBody(12).foregroundColor(CSColor.muted)
                    }
                    Spacer()
                    StatusBadge(status: volunteer.status, isVolunteer: true)
                    Image(systemName: expanded ? "chevron.up" : "chevron.down")
                        .foregroundColor(CSColor.muted)
                }
            }
            .buttonStyle(.plain)

            if expanded {
                Divider().background(CSColor.border)
                if let ph = volunteer.phone, !ph.isEmpty { detail("Phone", ph) }
                if let org = volunteer.organization, !org.isEmpty { detail("Org", org) }
                if let gt = volunteer.groupType, !gt.isEmpty { detail("Group", gt) }
                if let shirt = volunteer.shirtSize { detail("Shirt", shirt) }
                if let store = volunteer.storeLocation { detail("Store", store) }
                if let arr = volunteer.arrivalTime { detail("Arrival", arr) }
                if let exp = volunteer.experience, !exp.isEmpty { detail("Experience", exp) }
                if volunteer.earlyArrival == 1 { detail("Early arrival", "Yes") }
                if volunteer.smsOptIn == 1 { detail("SMS opt-in", "Yes") }

                HStack(spacing: CSSpacing.xs) {
                    ForEach(["registered", "confirmed", "assigned", "attended"], id: \.self) { status in
                        Button(status.capitalized) { onSetStatus(status) }
                            .font(CSFont.body(12, weight: .semibold))
                            .foregroundColor(volunteer.status == status ? .white : CSColor.navy)
                            .padding(.vertical, 8)
                            .padding(.horizontal, 12)
                            .background(volunteer.status == status ? CSColor.navy : CSColor.bg)
                            .overlay(RoundedRectangle(cornerRadius: CSRadius.pill).stroke(CSColor.border, lineWidth: 1))
                            .cornerRadius(CSRadius.pill)
                    }
                }
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
            Text(value).csBody(13).foregroundColor(CSColor.text)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

@MainActor
final class AdminVolunteersVM: ObservableObject {
    @Published var volunteers: [Volunteer] = []
    @Published var search: String = ""
    @Published var loading = false
    @Published var error: String?
    @Published var exportURL: URL?

    private struct StatusUpdate: Encodable { let status: String }

    func load() async {
        loading = true
        error = nil
        defer { loading = false }
        do {
            let resp = try await APIClient.shared.request(
                .listVolunteers(status: nil, search: search),
                as: VolunteersResponse.self
            )
            self.volunteers = resp.volunteers
        } catch {
            self.error = error.localizedDescription
        }
    }

    func updateStatus(_ v: Volunteer, status: String) async {
        do {
            try await APIClient.shared.requestVoid(
                .volunteer(id: v.id), body: StatusUpdate(status: status)
            )
            await load()
        } catch {
            self.error = error.localizedDescription
        }
    }

    func exportCSV() {
        let headers = [
            "ID", "Status", "First", "Last", "Email", "Phone",
            "Organization", "Group", "Shirt", "Store", "Arrival",
            "Early Arrival", "Experience", "Hear About", "SMS Opt-In", "Created"
        ]
        var rows = [headers.joined(separator: ",")]
        for v in volunteers {
            let cols: [String] = [
                v.id, v.status, v.firstName, v.lastName, v.email,
                v.phone ?? "", v.organization ?? "", v.groupType ?? "",
                v.shirtSize ?? "", v.storeLocation ?? "", v.arrivalTime ?? "",
                (v.earlyArrival == 1 ? "Yes" : "No"),
                v.experience ?? "", v.hearAbout ?? "",
                (v.smsOptIn == 1 ? "Yes" : "No"), v.createdAt
            ].map(CSVEscape.quote)
            rows.append(cols.joined(separator: ","))
        }
        let csv = rows.joined(separator: "\n")
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("volunteers-\(Int(Date().timeIntervalSince1970)).csv")
        try? csv.data(using: .utf8)?.write(to: url)
        self.exportURL = url
    }
}
