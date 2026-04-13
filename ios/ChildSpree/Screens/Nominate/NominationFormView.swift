import SwiftUI

/// Nomination form — mirrors `NominationForm` in `src/App.jsx:507`.
struct NominationFormView: View {
    @EnvironmentObject var lang: Lang
    @EnvironmentObject var auth: AuthStore
    @StateObject private var vm = NominationVM()

    var body: some View {
        ScrollView {
            if vm.submitted {
                submittedView
            } else {
                formView
            }
        }
        .background(CSColor.bg)
        .navigationTitle(lang.t(.nominate))
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { vm.prefillFromMSUser(auth.msUser) }
    }

    // MARK: - Form

    private var formView: some View {
        VStack(alignment: .leading, spacing: CSSpacing.lg) {
            header
            childSection
            nominatorSection
            parentSection
            detailsSection
            submitRow
        }
        .padding(CSSpacing.lg)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: CSSpacing.sm) {
            Text(lang.t(.nomFormTitle))
                .csDisplay(28)
                .foregroundColor(CSColor.navy)
            Text("Takes \(lang.t(.nomFormSubtitle))")
                .csBody(14)
                .foregroundColor(CSColor.muted)
            Text(lang.t(.nomFormConfidential))
                .csBody(12)
                .foregroundColor(CSColor.muted)
                .italic()
        }
    }

    private var childSection: some View {
        CSCard {
            VStack(alignment: .leading) {
                CSSectionHeader(text: lang.t(.childInfoTitle))
                HStack(spacing: CSSpacing.md) {
                    CSTextField(label: lang.t(.firstName), text: $vm.childFirst, autocap: .words)
                    CSTextField(label: lang.t(.lastName), text: $vm.childLast, autocap: .words)
                }
                CSTextField(
                    label: lang.t(.studentId),
                    text: $vm.studentId,
                    placeholder: lang.t(.studentIdPlaceholder),
                    keyboard: .numberPad
                )
                CSStringPicker(
                    label: lang.t(.school),
                    options: Catalogs.schools,
                    selection: $vm.school,
                    placeholder: lang.t(.selectSchool)
                )
                CSStringPicker(
                    label: lang.t(.grade),
                    options: Catalogs.grades,
                    selection: $vm.grade
                )
                Text(lang.t(.gradeNote))
                    .csBody(12)
                    .foregroundColor(CSColor.muted)
                    .padding(.top, -8)
            }
        }
    }

    private var nominatorSection: some View {
        CSCard {
            VStack(alignment: .leading) {
                CSSectionHeader(text: lang.t(.yourInfoTitle))
                CSTextField(label: lang.t(.yourName), text: $vm.nominatorName, placeholder: lang.t(.fullName), autocap: .words)
                HStack(spacing: CSSpacing.md) {
                    CSStringPicker(label: lang.t(.role), options: Catalogs.nominatorRoles, selection: $vm.nominatorRole)
                    CSTextField(label: lang.t(.email), text: $vm.nominatorEmail, keyboard: .emailAddress, autocap: .never)
                }
                CSTextField(label: "Phone (optional — for text updates)", text: $vm.nominatorPhone, keyboard: .phonePad, autocap: .never)
            }
        }
    }

    private var parentSection: some View {
        CSCard {
            VStack(alignment: .leading) {
                CSSectionHeader(text: lang.t(.parentGuardianTitle))
                CSTextField(label: lang.t(.parentName), text: $vm.parentName, autocap: .words)
                HStack(spacing: CSSpacing.md) {
                    CSTextField(label: lang.t(.parentPhone), text: $vm.parentPhone, keyboard: .phonePad, autocap: .never)
                    CSTextField(label: lang.t(.parentEmail), text: $vm.parentEmail, keyboard: .emailAddress, autocap: .never)
                }
                CSStringPicker(
                    label: lang.t(.preferredLang),
                    options: ["English", "Español"],
                    selection: $vm.parentLanguageDisplay
                )
                Text(lang.t(.langNote))
                    .csBody(12)
                    .foregroundColor(CSColor.muted)
                    .padding(.top, -8)
            }
        }
    }

    private var detailsSection: some View {
        CSCard {
            VStack(alignment: .leading) {
                CSSectionHeader(text: lang.t(.detailsTitle))
                CSTextEditor(
                    label: lang.t(.whyNominate),
                    text: $vm.reason,
                    placeholder: lang.t(.reasonPlaceholder)
                )

                Text(lang.t(.siblingsQuestion))
                    .font(CSFont.body(13, weight: .semibold))
                    .foregroundColor(CSColor.text)
                    .padding(.top, CSSpacing.sm)

                HStack(spacing: CSSpacing.xs) {
                    ForEach(0...4, id: \.self) { n in
                        ChipButton(title: n == 0 ? lang.t(.none) : "\(n)", isSelected: vm.siblingCount == n) {
                            vm.setSiblingCount(n)
                        }
                    }
                }
                .padding(.bottom, CSSpacing.sm)

                ForEach(vm.siblings.indices, id: \.self) { i in
                    VStack(alignment: .leading) {
                        Text("\(lang.t(.siblingLabel)) \(i + 1)")
                            .font(CSFont.body(12, weight: .semibold))
                            .foregroundColor(CSColor.muted)
                        HStack(spacing: CSSpacing.md) {
                            CSTextField(label: nil, text: $vm.siblings[i].name, placeholder: lang.t(.siblingName), autocap: .words)
                            CSTextField(label: nil, text: $vm.siblings[i].studentId, placeholder: lang.t(.siblingStudentId), keyboard: .numberPad, autocap: .never)
                        }
                    }
                }
            }
        }
    }

    private var submitRow: some View {
        VStack(alignment: .leading, spacing: CSSpacing.sm) {
            if let err = vm.error {
                Text(err).csBody(13).foregroundColor(CSColor.red)
            }
            PinkButton(title: vm.submitting ? lang.t(.submitting) : lang.t(.submitNomination),
                       isLoading: vm.submitting) {
                Task { await vm.submit() }
            }
        }
    }

    // MARK: - Success

    private var submittedView: some View {
        VStack(spacing: CSSpacing.lg) {
            Text("🎉").font(.system(size: 60))
            Text(lang.t(.nomSuccess))
                .csDisplay(26)
                .foregroundColor(CSColor.navy)
            Text(lang.t(.nomSuccessMsg))
                .csBody(15)
                .foregroundColor(CSColor.muted)
                .multilineTextAlignment(.center)
                .padding(.horizontal, CSSpacing.xl)
            NavyButton(title: lang.t(.nominateAnother), isFullWidth: false) { vm.reset() }
        }
        .padding(.vertical, CSSpacing.xxxl)
        .frame(maxWidth: .infinity)
    }
}

// MARK: - View Model

@MainActor
final class NominationVM: ObservableObject {
    struct Sibling { var name: String = ""; var studentId: String = "" }

    @Published var childFirst = ""
    @Published var childLast = ""
    @Published var studentId = ""
    @Published var school = ""
    @Published var grade = ""
    @Published var nominatorName = ""
    @Published var nominatorRole = "Teacher"
    @Published var nominatorEmail = ""
    @Published var nominatorPhone = ""
    @Published var parentName = ""
    @Published var parentPhone = ""
    @Published var parentEmail = ""
    @Published var parentLanguageDisplay = "English"
    @Published var reason = ""
    @Published var siblingCount = 0
    @Published var siblings: [Sibling] = []

    @Published var submitting = false
    @Published var submitted = false
    @Published var error: String?

    func prefillFromMSUser(_ user: MSALAuth.User?) {
        guard let user else { return }
        if nominatorName.isEmpty { nominatorName = user.displayName }
        if nominatorEmail.isEmpty { nominatorEmail = user.email }
    }

    func setSiblingCount(_ n: Int) {
        siblingCount = n
        while siblings.count < n { siblings.append(Sibling()) }
        while siblings.count > n { siblings.removeLast() }
    }

    func reset() {
        submitted = false
        error = nil
        childFirst = ""; childLast = ""; studentId = ""
        school = ""; grade = ""; reason = ""
        parentName = ""; parentPhone = ""; parentEmail = ""
        siblingCount = 0; siblings = []
    }

    func submit() async {
        error = nil
        guard !childFirst.isEmpty, !childLast.isEmpty, !studentId.isEmpty, !school.isEmpty, !grade.isEmpty else {
            error = "Please fill in all child information, including Student ID."
            return
        }
        guard !nominatorName.isEmpty, !nominatorEmail.isEmpty else {
            error = "Please fill in your name and email."
            return
        }
        guard !parentName.isEmpty else {
            error = "Parent/guardian name required."
            return
        }
        guard !parentPhone.isEmpty || !parentEmail.isEmpty else {
            error = "Please provide at least one parent contact."
            return
        }

        let langCode = parentLanguageDisplay == "Español" ? "es" : "en"
        let siblingData = siblings.filter { !$0.name.trimmingCharacters(in: .whitespaces).isEmpty }
        let siblingsDataJSON: String? = {
            guard !siblingData.isEmpty else { return nil }
            let arr = siblingData.map { ["name": $0.name, "studentId": $0.studentId] }
            if let d = try? JSONSerialization.data(withJSONObject: arr),
               let s = String(data: d, encoding: .utf8) { return s }
            return nil
        }()
        let siblingNames: String? = siblingData.isEmpty
            ? nil
            : siblingData.map(\.name).joined(separator: ", ")

        submitting = true
        defer { submitting = false }

        let req = CreateNominationRequest(
            childFirst: childFirst, childLast: childLast,
            studentId: studentId.isEmpty ? nil : studentId,
            school: school, grade: grade,
            nominatorName: nominatorName, nominatorRole: nominatorRole, nominatorEmail: nominatorEmail,
            nominatorPhone: nominatorPhone.isEmpty ? nil : nominatorPhone,
            parentName: parentName,
            parentPhone: parentPhone.isEmpty ? nil : parentPhone,
            parentEmail: parentEmail.isEmpty ? nil : parentEmail,
            reason: reason.isEmpty ? nil : reason,
            siblingCount: siblingData.count,
            siblingNames: siblingNames,
            siblingsData: siblingsDataJSON,
            additionalNotes: nil,
            parentLanguage: langCode
        )

        do {
            _ = try await APIClient.shared.request(
                .createNomination, as: CreateNominationResponse.self, body: req
            )
            submitted = true
        } catch {
            self.error = error.localizedDescription
        }
    }
}
