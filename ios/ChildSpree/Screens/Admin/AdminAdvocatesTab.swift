import SwiftUI

/// Family Advocate manager — mirrors the advocates tab of `AdminDashboard`.
/// Lists existing FAs via `GET /api/fa` and creates new ones via `POST /api/fa`.
struct AdminAdvocatesTab: View {
    @StateObject private var vm = AdminAdvocatesVM()
    @State private var showAdd = false

    var body: some View {
        VStack(spacing: 0) {
            header
            if let err = vm.error {
                Text(err).csBody(13).foregroundColor(CSColor.red).padding(CSSpacing.md)
            }
            list
        }
        .task { await vm.load() }
        .refreshable { await vm.load() }
        .sheet(isPresented: $showAdd) {
            NavigationStack {
                AddAdvocateSheet { req in
                    await vm.create(req)
                    showAdd = false
                }
            }
        }
    }

    private var header: some View {
        HStack {
            Text("\(vm.advocates.count) advocates")
                .csBody(12)
                .foregroundColor(CSColor.muted)
            Spacer()
            Button {
                showAdd = true
            } label: {
                Label("Add Advocate", systemImage: "plus.circle.fill")
                    .font(CSFont.body(13, weight: .semibold))
                    .foregroundColor(CSColor.pink)
            }
            .buttonStyle(.plain)
        }
        .padding(CSSpacing.md)
    }

    private var list: some View {
        ScrollView {
            LazyVStack(spacing: CSSpacing.sm) {
                if vm.loading {
                    ProgressView().padding(CSSpacing.xl)
                } else if vm.advocates.isEmpty {
                    Text("No Family Advocates yet.")
                        .csBody(13)
                        .foregroundColor(CSColor.muted)
                        .padding(CSSpacing.xl)
                } else {
                    ForEach(vm.advocates) { fa in
                        AdvocateRow(advocate: fa)
                    }
                }
            }
            .padding(.horizontal, CSSpacing.md)
            .padding(.bottom, CSSpacing.xl)
        }
    }
}

private struct AdvocateRow: View {
    let advocate: FamilyAdvocate
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(advocate.displayName)
                    .font(CSFont.body(15, weight: .semibold))
                    .foregroundColor(CSColor.text)
                Spacer()
                if let count = advocate.nominationCount {
                    Text("\(count) noms")
                        .csBody(11, weight: .semibold)
                        .foregroundColor(CSColor.navy)
                        .padding(.vertical, 3)
                        .padding(.horizontal, 8)
                        .background(CSColor.pinkLight.opacity(0.4))
                        .cornerRadius(CSRadius.pill)
                }
            }
            Text(advocate.email).csBody(12).foregroundColor(CSColor.muted)
            if let ph = advocate.phone, !ph.isEmpty {
                Text(ph).csBody(12).foregroundColor(CSColor.muted)
            }
            if let sc = advocate.school, !sc.isEmpty {
                Text(sc).csBody(12).foregroundColor(CSColor.light)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(CSSpacing.md)
        .background(CSColor.card)
        .overlay(RoundedRectangle(cornerRadius: CSRadius.card).stroke(CSColor.border, lineWidth: 1))
        .cornerRadius(CSRadius.card)
    }
}

private struct AddAdvocateSheet: View {
    let onSubmit: (CreateAdvocateRequest) async -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var school = ""
    @State private var notes = ""
    @State private var submitting = false
    @State private var error: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: CSSpacing.md) {
                CSTextField(label: "First Name *", text: $firstName)
                CSTextField(label: "Last Name *", text: $lastName)
                CSTextField(label: "Email *", text: $email, keyboard: .emailAddress, autocap: .never)
                CSTextField(label: "Phone", text: $phone, keyboard: .phonePad)
                CSStringPicker(label: "School", options: Catalogs.schools, selection: $school)
                CSTextEditor(label: "Notes", text: $notes, minHeight: 80)

                if let err = error {
                    Text(err).csBody(13).foregroundColor(CSColor.red)
                }

                PinkButton(
                    title: submitting ? "Saving…" : "Add Advocate",
                    isLoading: submitting
                ) {
                    Task { await submit() }
                }
            }
            .padding(CSSpacing.lg)
        }
        .navigationTitle("New Advocate")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Cancel") { dismiss() }
            }
        }
    }

    private func submit() async {
        error = nil
        guard !firstName.isEmpty, !lastName.isEmpty, email.contains("@") else {
            error = "First name, last name, and a valid email are required."
            return
        }
        submitting = true
        defer { submitting = false }
        let req = CreateAdvocateRequest(
            firstName: firstName,
            lastName: lastName,
            email: email,
            phone: phone.isEmpty ? nil : phone,
            school: school.isEmpty ? nil : school,
            notes: notes.isEmpty ? nil : notes
        )
        await onSubmit(req)
    }
}

@MainActor
final class AdminAdvocatesVM: ObservableObject {
    @Published var advocates: [FamilyAdvocate] = []
    @Published var loading = false
    @Published var error: String?

    func load() async {
        loading = true
        error = nil
        defer { loading = false }
        do {
            let resp = try await APIClient.shared.request(
                .listAdvocates, as: FamilyAdvocatesResponse.self
            )
            self.advocates = resp.advocates
        } catch {
            self.error = error.localizedDescription
        }
    }

    func create(_ req: CreateAdvocateRequest) async {
        do {
            try await APIClient.shared.requestVoid(.createAdvocate, body: req)
            await load()
        } catch {
            self.error = error.localizedDescription
        }
    }
}
