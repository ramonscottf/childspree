import SwiftUI

/// Parent intake — mirrors `ParentIntake` in `src/App.jsx:944`.
/// Fetches child info via token, collects sizes/prefs/consent, then chains
/// into `VideoCaptureView` or the done screen.
struct ParentIntakeView: View {
    let token: String
    @EnvironmentObject var lang: Lang
    @StateObject private var vm: IntakeVM

    init(token: String) {
        self.token = token
        _vm = StateObject(wrappedValue: IntakeVM(token: token))
    }

    var body: some View {
        Group {
            switch vm.phase {
            case .loading:
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            case .error(let msg):
                errorView(msg)
            case .form:
                form
            case .video:
                VideoCaptureView(token: token, childFirst: vm.childFirst) {
                    vm.phase = .done
                }
            case .done:
                doneView
            }
        }
        .task { await vm.load() }
        .background(LinearGradient(colors: [CSColor.bg, Color(hex: 0xEFF6FF)],
                                    startPoint: .top, endPoint: .bottom))
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Form

    private var form: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: CSSpacing.lg) {
                header

                CSCard {
                    VStack(alignment: .leading) {
                        CSSectionHeader(text: lang.t(.aboutTitle))
                        HStack(spacing: CSSpacing.sm) {
                            ForEach(["Girl", "Boy", "Non-binary / Other"], id: \.self) { g in
                                ChipButton(title: g, isSelected: vm.gender == g) { vm.gender = g }
                            }
                        }
                        .padding(.bottom, CSSpacing.sm)
                        CSStringPicker(
                            label: lang.t(.deptLabel),
                            options: [lang.t(.deptGirls), lang.t(.deptBoys), lang.t(.deptJuniors), lang.t(.deptEither)],
                            selection: $vm.department
                        )
                        CSTextField(label: "Child's age (optional)", text: $vm.childAge, keyboard: .numberPad, autocap: .never)
                    }
                }

                CSCard {
                    VStack(alignment: .leading) {
                        CSSectionHeader(text: lang.t(.clothingSizes))
                        SizePickerView(
                            label: lang.t(.shirtLabel),
                            options: vm.gender == "Boy" ? Catalogs.shirtSizesBoys : Catalogs.shirtSizesGirls,
                            selection: $vm.shirtSize
                        )
                        SizePickerView(
                            label: lang.t(.pantLabel),
                            options: vm.gender == "Boy" ? Catalogs.pantSizesBoys : Catalogs.pantSizesGirls,
                            selection: $vm.pantSize
                        )
                        SizePickerView(
                            label: lang.t(.shoeLabel),
                            options: Catalogs.shoeSizes,
                            selection: $vm.shoeSize
                        )
                    }
                }

                CSCard {
                    VStack(alignment: .leading) {
                        HStack {
                            Text(lang.t(.prefsTitle).uppercased())
                                .font(CSFont.body(11, weight: .bold))
                                .foregroundColor(CSColor.navy)
                                .tracking(1.2)
                            Text("(\(lang.t(.prefsOptional)))")
                                .font(CSFont.body(11))
                                .foregroundColor(CSColor.light)
                        }
                        .padding(.bottom, CSSpacing.sm)
                        Rectangle().fill(CSColor.pinkLight).frame(height: 2).padding(.bottom, CSSpacing.sm)
                        CSTextField(label: lang.t(.colorsLabel), text: $vm.favoriteColors, placeholder: lang.t(.colorsPlaceholder))
                        CSTextField(label: lang.t(.avoidLabel), text: $vm.avoidColors, placeholder: lang.t(.avoidPlaceholder))
                        CSTextField(label: lang.t(.sensoryLabel), text: $vm.allergies, placeholder: lang.t(.sensoryPlaceholder))
                        CSTextEditor(label: lang.t(.notesLabel), text: $vm.preferences)
                    }
                }

                CSCard {
                    VStack(alignment: .leading, spacing: CSSpacing.sm) {
                        Toggle(isOn: $vm.consent) {
                            Text(lang.t(.consentLabel))
                                .csBody(13)
                                .foregroundColor(CSColor.text)
                        }
                        .tint(CSColor.pink)
                    }
                }

                if let err = vm.submitError {
                    Text(err).csBody(13).foregroundColor(CSColor.red)
                }
                PinkButton(title: vm.submitting ? lang.t(.submitIntakeSaving) : lang.t(.submitIntake),
                           isLoading: vm.submitting) {
                    Task { await vm.submit() }
                }
            }
            .padding(CSSpacing.lg)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: CSSpacing.sm) {
            Text("\(lang.t(.intakeTitle)) \(vm.childFirst)")
                .csDisplay(26)
                .foregroundColor(CSColor.navy)
            Text(lang.t(.intakeSubtitle))
                .csBody(14)
                .foregroundColor(CSColor.muted)
            Text(lang.t(.intakeConfidential))
                .csBody(12)
                .foregroundColor(CSColor.muted)
                .italic()
        }
    }

    private func errorView(_ msg: String) -> some View {
        VStack(spacing: CSSpacing.md) {
            Text("😕").font(.system(size: 48))
            Text("Link Problem")
                .csDisplay(22)
                .foregroundColor(CSColor.navy)
            Text(msg).csBody(14).foregroundColor(CSColor.muted).multilineTextAlignment(.center)
                .padding(.horizontal, CSSpacing.xl)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var doneView: some View {
        VStack(spacing: CSSpacing.lg) {
            Text("🎉").font(.system(size: 60))
            Text(lang.t(.intakeDoneTitle))
                .csDisplay(28)
                .foregroundColor(CSColor.navy)
            Text("\(lang.t(.intakeDoneMsg)) \(vm.childFirst)\(lang.t(.intakeDoneMsg2))")
                .csBody(15)
                .foregroundColor(CSColor.muted)
                .multilineTextAlignment(.center)
                .padding(.horizontal, CSSpacing.xl)
        }
        .padding(.vertical, CSSpacing.xxxl)
        .frame(maxWidth: .infinity)
    }
}

// MARK: - View Model

@MainActor
final class IntakeVM: ObservableObject {
    enum Phase: Equatable { case loading, form, video, done, error(String) }

    let token: String

    @Published var phase: Phase = .loading
    @Published var childFirst = ""
    @Published var childLast = ""
    @Published var school = ""
    @Published var grade = ""
    @Published var parentLanguage = "en"

    @Published var gender = "Girl"
    @Published var department = ""
    @Published var shirtSize = ""
    @Published var pantSize = ""
    @Published var shoeSize = ""
    @Published var favoriteColors = ""
    @Published var avoidColors = ""
    @Published var allergies = ""
    @Published var preferences = ""
    @Published var childAge = ""
    @Published var consent = false

    @Published var submitting = false
    @Published var submitError: String?

    init(token: String) { self.token = token }

    func load() async {
        do {
            let resp = try await APIClient.shared.request(
                .intake(token: token), as: IntakeFetchResponse.self
            )
            self.childFirst = resp.childFirst
            self.childLast = resp.childLast
            self.school = resp.school
            self.grade = resp.grade
            self.parentLanguage = resp.parentLanguage
            if resp.alreadySubmitted {
                self.phase = .done
            } else {
                self.phase = .form
            }
        } catch {
            self.phase = .error(error.localizedDescription)
        }
    }

    func submit() async {
        submitError = nil
        guard !shirtSize.isEmpty, !pantSize.isEmpty, !shoeSize.isEmpty else {
            submitError = "Shirt, pants, and shoe sizes are required."
            return
        }
        guard consent else {
            submitError = "Please check the consent box to continue."
            return
        }

        submitting = true
        defer { submitting = false }

        let req = IntakeSubmitRequest(
            shirtSize: shirtSize, pantSize: pantSize, shoeSize: shoeSize,
            gender: gender,
            department: department.isEmpty ? nil : department,
            favoriteColors: favoriteColors.isEmpty ? nil : favoriteColors,
            avoidColors: avoidColors.isEmpty ? nil : avoidColors,
            allergies: allergies.isEmpty ? nil : allergies,
            preferences: preferences.isEmpty ? nil : preferences,
            parentConsent: consent,
            language: parentLanguage,
            childAge: childAge.isEmpty ? nil : childAge
        )

        do {
            try await APIClient.shared.requestVoid(.intake(token: token, method: .POST), body: req)
            phase = .video
        } catch {
            submitError = error.localizedDescription
        }
    }
}
