import SwiftUI

/// Volunteer registration — mirrors `VolunteerForm` in `src/App.jsx:657`.
struct VolunteerFormView: View {
    @EnvironmentObject var lang: Lang
    @StateObject private var vm = VolunteerVM()

    var body: some View {
        ScrollView {
            if vm.submitted { successView } else { form }
        }
        .background(CSColor.bg)
        .navigationTitle(lang.t(.volunteer))
        .navigationBarTitleDisplayMode(.inline)
    }

    private var form: some View {
        VStack(alignment: .leading, spacing: CSSpacing.lg) {
            header

            CSCard {
                VStack(alignment: .leading) {
                    CSSectionHeader(text: "Your Info")
                    HStack(spacing: CSSpacing.md) {
                        CSTextField(label: "First Name *", text: $vm.firstName, autocap: .words)
                        CSTextField(label: "Last Name *", text: $vm.lastName, autocap: .words)
                    }
                    HStack(spacing: CSSpacing.md) {
                        CSTextField(label: "Email *", text: $vm.email, keyboard: .emailAddress, autocap: .never)
                        CSTextField(label: "Phone *", text: $vm.phone, keyboard: .phonePad, autocap: .never)
                    }
                    CSTextField(label: "Organization / Company (optional)", text: $vm.organization, autocap: .words)
                    CSStringPicker(label: "Coming with...", options: Catalogs.volunteerGroupTypes, selection: $vm.groupType)
                }
            }

            CSCard {
                VStack(alignment: .leading) {
                    CSSectionHeader(text: "Event Details")
                    CSStringPicker(label: "Store Location *", options: Catalogs.storeLocations, selection: $vm.storeLocation)
                    CSStringPicker(label: "Arrival Time *", options: Catalogs.arrivalTimes, selection: $vm.arrivalTime)
                    Toggle(isOn: $vm.earlyArrival) {
                        Text("I can arrive at 6:30 AM to help set up")
                            .csBody(13)
                            .foregroundColor(CSColor.text)
                    }
                    .tint(CSColor.pink)
                    .padding(.vertical, CSSpacing.sm)
                    CSStringPicker(label: "Volunteer Shirt Size *", options: Catalogs.volunteerShirts, selection: $vm.shirtSize)
                }
            }

            CSCard {
                VStack(alignment: .leading) {
                    CSSectionHeader(text: "A Little More")
                    CSStringPicker(
                        label: "Have you volunteered with Child Spree before?",
                        options: ["First time!", "Yes, once", "Yes, multiple times"],
                        selection: $vm.experience
                    )
                    CSStringPicker(
                        label: "How did you hear about us?",
                        options: ["Friend/Family", "School", "Work", "Social Media", "News", "Other"],
                        selection: $vm.hearAbout
                    )
                    Toggle(isOn: $vm.smsOptIn) {
                        Text("OK to text me with updates the week of the event")
                            .csBody(13)
                            .foregroundColor(CSColor.text)
                    }
                    .tint(CSColor.pink)
                }
            }

            if let err = vm.error {
                Text(err).csBody(13).foregroundColor(CSColor.red)
            }
            PinkButton(title: vm.submitting ? "Registering..." : "Register to Volunteer",
                       isLoading: vm.submitting) {
                Task { await vm.submit() }
            }
        }
        .padding(CSSpacing.lg)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: CSSpacing.sm) {
            Text("Volunteer to Shop")
                .csDisplay(28)
                .foregroundColor(CSColor.navy)
            Text("First Friday in August, 7:00 AM. You'll be matched with one child and shop for them head to toe.")
                .csBody(14)
                .foregroundColor(CSColor.muted)
        }
    }

    private var successView: some View {
        VStack(spacing: CSSpacing.lg) {
            Text("🎉").font(.system(size: 60))
            Text("You're In!")
                .csDisplay(26)
                .foregroundColor(CSColor.navy)
            Text("Thank you for volunteering. We'll send event details closer to the date.")
                .csBody(15)
                .foregroundColor(CSColor.muted)
                .multilineTextAlignment(.center)
                .padding(.horizontal, CSSpacing.xl)
        }
        .padding(.vertical, CSSpacing.xxxl)
        .frame(maxWidth: .infinity)
    }
}

@MainActor
final class VolunteerVM: ObservableObject {
    @Published var firstName = ""
    @Published var lastName = ""
    @Published var email = ""
    @Published var phone = ""
    @Published var organization = ""
    @Published var groupType = "Just me"
    @Published var storeLocation = ""
    @Published var arrivalTime = ""
    @Published var earlyArrival = false
    @Published var shirtSize = ""
    @Published var experience = "First time!"
    @Published var hearAbout = ""
    @Published var smsOptIn = true

    @Published var submitting = false
    @Published var submitted = false
    @Published var error: String?

    func submit() async {
        error = nil
        guard !firstName.isEmpty, !lastName.isEmpty, !email.isEmpty, !phone.isEmpty,
              !storeLocation.isEmpty, !arrivalTime.isEmpty, !shirtSize.isEmpty else {
            error = "Please fill in all required fields."
            return
        }

        submitting = true
        defer { submitting = false }

        let req = CreateVolunteerRequest(
            firstName: firstName, lastName: lastName, email: email, phone: phone,
            organization: organization.isEmpty ? nil : organization,
            groupType: groupType,
            shirtSize: shirtSize,
            storeLocation: storeLocation,
            arrivalTime: arrivalTime,
            earlyArrival: earlyArrival,
            experience: experience,
            hearAbout: hearAbout.isEmpty ? nil : hearAbout,
            smsOptIn: smsOptIn
        )
        do {
            try await APIClient.shared.requestVoid(.createVolunteer, body: req)
            submitted = true
        } catch {
            self.error = error.localizedDescription
        }
    }
}
