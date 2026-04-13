import SwiftUI

/// Landing / Home — mirrors `LandingPage` in `src/App.jsx:414`.
/// Hero with rotating photos, stats row, 4-step "journey", photo grid, and
/// CTA cards for nominate + volunteer, plus sponsor CTA.
struct LandingView: View {
    @EnvironmentObject var router: DeepLinkRouter
    @EnvironmentObject var lang: Lang
    @State private var photoIdx = 0
    private let carouselTimer = Timer.publish(every: 4, on: .main, in: .common).autoconnect()

    private let stats: [(String, String)] = [
        ("500+", "Students served each August"),
        ("$150", "Per child — head to toe"),
        ("400+", "Volunteers before sunrise"),
        ("1", "Day that changes a year"),
    ]

    private struct Step {
        let icon: String
        let title: String
        let body: String
    }

    private let journey: [Step] = [
        Step(icon: "✏️", title: "A teacher sees the need",
             body: "It starts in the classroom. An educator notices a student wearing the same worn-out clothes. They fill out a quiet nomination. No awkward conversations. Just someone who cares taking the first step."),
        Step(icon: "🎬", title: "A child shares their dream outfit",
             body: "Families share sizes and students record a short video. Favorite colors. The shoes they've been dreaming about. For many, it's the first time anyone has asked what they actually want to wear."),
        Step(icon: "🛒", title: "A stranger wakes up early to shop",
             body: "Before sunrise on the first Friday of August, 400+ volunteers arrive at Kohl's. Each one is matched to a single child — they've watched the video, they know the favorite color, they're ready."),
        Step(icon: "✨", title: "A child walks in like they own the place",
             body: "New shoes. New backpack. New everything. The look on a child's face when they realize someone they've never met cared enough to pick out their first new outfit. That's Child Spree."),
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                hero
                statsStrip
                journeySection
                photoGrid
                ctaCards
                sponsorCTA
                footer
            }
        }
        .background(CSColor.card)
        .ignoresSafeArea(.container, edges: .top)
        .onReceive(carouselTimer) { _ in
            withAnimation(.easeInOut(duration: 1.2)) {
                photoIdx = (photoIdx + 1) % Catalogs.heroPhotos.count
            }
        }
    }

    // MARK: - Hero

    private var hero: some View {
        ZStack(alignment: .bottomLeading) {
            // Photo stack
            ZStack {
                ForEach(Catalogs.heroPhotos.indices, id: \.self) { i in
                    AsyncImage(url: URL(string: Catalogs.heroPhotos[i])) { phase in
                        switch phase {
                        case .success(let img):
                            img.resizable().scaledToFill()
                        default:
                            CSColor.navy
                        }
                    }
                    .opacity(i == photoIdx ? 1 : 0)
                }
            }
            .frame(height: 480)
            .clipped()

            // Gradient overlay
            LinearGradient(
                colors: [Color.black.opacity(0.25), CSColor.navy.opacity(0.88)],
                startPoint: .top, endPoint: .bottom
            )
            .frame(height: 480)

            // Copy + CTAs
            VStack(alignment: .leading, spacing: CSSpacing.md) {
                Text("EVERY AUGUST · THREE DAVIS COUNTY KOHL'S")
                    .font(CSFont.body(11, weight: .bold))
                    .foregroundColor(CSColor.pinkLight.opacity(0.9))
                    .tracking(2)
                Text("500+ students.\nBrand new clothes.")
                    .csDisplay(34)
                    .foregroundColor(.white)
                    .lineLimit(nil)
                Text("One unforgettable morning.")
                    .csDisplay(26, weight: .semibold)
                    .foregroundColor(CSColor.pinkLight)
                    .italic()
                Text("Every August, Davis County volunteers wake up before sunrise to shop for a child they've never met — based on that child's video, their favorite color, their dream outfit.")
                    .csBody(14)
                    .foregroundColor(.white.opacity(0.85))
                    .lineLimit(nil)
                    .padding(.vertical, CSSpacing.sm)

                HStack(spacing: CSSpacing.sm) {
                    PinkButton(title: lang.t(.nominateBtn), isFullWidth: false) {
                        router.selectedTab = .nominate
                    }
                    OutlineButton(title: "Volunteer to Shop") {
                        router.selectedTab = .volunteer
                    }
                }
            }
            .padding(.horizontal, CSSpacing.xl)
            .padding(.bottom, CSSpacing.xxl)
        }
        .frame(height: 480)
    }

    // MARK: - Stats

    private var statsStrip: some View {
        VStack(spacing: CSSpacing.lg) {
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: CSSpacing.xl) {
                ForEach(stats, id: \.0) { num, label in
                    VStack(spacing: CSSpacing.xs) {
                        Text(num).csDisplay(36).foregroundColor(CSColor.pinkLight)
                        Text(label)
                            .csBody(12)
                            .foregroundColor(.white.opacity(0.65))
                            .multilineTextAlignment(.center)
                    }
                }
            }
            .padding(CSSpacing.xl)
        }
        .frame(maxWidth: .infinity)
        .background(CSColor.navy)
    }

    // MARK: - Journey

    private var journeySection: some View {
        VStack(alignment: .center, spacing: CSSpacing.xl) {
            VStack(spacing: CSSpacing.sm) {
                Text("THE JOURNEY")
                    .font(CSFont.body(11, weight: .bold))
                    .foregroundColor(CSColor.pink)
                    .tracking(2)
                Text("From a teacher's heart\nto a child's first-day smile.")
                    .csDisplay(24)
                    .foregroundColor(CSColor.navy)
                    .multilineTextAlignment(.center)
            }

            VStack(spacing: CSSpacing.md) {
                ForEach(Array(journey.enumerated()), id: \.offset) { _, step in
                    HStack(alignment: .top, spacing: CSSpacing.md) {
                        Text(step.icon).font(.system(size: 28))
                        VStack(alignment: .leading, spacing: CSSpacing.xs) {
                            Text(step.title)
                                .csDisplay(17, weight: .semibold)
                                .foregroundColor(CSColor.navy)
                            Text(step.body)
                                .csBody(13)
                                .foregroundColor(CSColor.muted)
                                .lineSpacing(4)
                        }
                    }
                    .padding(CSSpacing.lg)
                    .background(CSColor.bg)
                    .overlay(
                        Rectangle()
                            .fill(CSColor.pink)
                            .frame(width: 4),
                        alignment: .leading
                    )
                    .cornerRadius(CSRadius.card)
                }
            }
        }
        .padding(.horizontal, CSSpacing.xl)
        .padding(.vertical, CSSpacing.xxxl)
    }

    // MARK: - Photo grid

    private var photoGrid: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: CSSpacing.sm) {
            ForEach(Catalogs.heroPhotos.prefix(4), id: \.self) { url in
                AsyncImage(url: URL(string: url)) { phase in
                    switch phase {
                    case .success(let img):
                        img.resizable().scaledToFill()
                    default:
                        CSColor.border
                    }
                }
                .frame(height: 140)
                .clipped()
                .cornerRadius(CSRadius.card)
            }
        }
        .padding(.horizontal, CSSpacing.xl)
        .padding(.bottom, CSSpacing.xxxl)
    }

    // MARK: - CTA cards

    private var ctaCards: some View {
        VStack(spacing: CSSpacing.md) {
            // Nominate card
            VStack(alignment: .leading, spacing: CSSpacing.sm) {
                Text("📋").font(.system(size: 36))
                Text("Nominate a Child")
                    .csDisplay(22)
                    .foregroundColor(.white)
                Text("Teachers, counselors, and school staff — if you know a student who needs support, nominate them. It takes 3 minutes and could change their entire school year.")
                    .csBody(14)
                    .foregroundColor(.white.opacity(0.75))
                PinkButton(title: "Start a Nomination →", isFullWidth: false) {
                    router.selectedTab = .nominate
                }
            }
            .padding(CSSpacing.xl)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(CSColor.navy)
            .cornerRadius(CSRadius.hero)

            // Volunteer card
            VStack(alignment: .leading, spacing: CSSpacing.sm) {
                Text("🛒").font(.system(size: 36))
                Text("Volunteer to Shop")
                    .csDisplay(22)
                    .foregroundColor(CSColor.navy)
                Text("Join 400+ volunteers on the first Friday of August at three Davis County Kohl's locations (Layton, Centerville & Clinton). You'll be matched with one child and shop for them head to toe.")
                    .csBody(14)
                    .foregroundColor(CSColor.muted)
                NavyButton(title: "Sign Up to Volunteer →", isFullWidth: false) {
                    router.selectedTab = .volunteer
                }
            }
            .padding(CSSpacing.xl)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(CSColor.card)
            .overlay(
                RoundedRectangle(cornerRadius: CSRadius.hero)
                    .stroke(CSColor.border, lineWidth: 1)
            )
            .cornerRadius(CSRadius.hero)
        }
        .padding(.horizontal, CSSpacing.xl)
        .padding(.vertical, CSSpacing.xxl)
        .background(CSColor.bg)
    }

    // MARK: - Sponsor CTA

    private var sponsorCTA: some View {
        VStack(spacing: CSSpacing.md) {
            Text("MAKE IT POSSIBLE")
                .font(CSFont.body(11, weight: .bold))
                .foregroundColor(CSColor.pinkLight)
                .tracking(2)
            Text("Sponsor a Student")
                .csDisplay(30)
                .foregroundColor(.white)
            Text("$150 covers one child — head to toe. New shoes. New clothes. New backpack. One donation. One complete, unforgettable morning.")
                .csBody(15)
                .foregroundColor(.white.opacity(0.7))
                .multilineTextAlignment(.center)
                .padding(.bottom, CSSpacing.sm)

            Link(destination: URL(string: "https://dsdgive.net/event/2")!) {
                Text(lang.t(.sponsorBtn))
                    .font(CSFont.body(16, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.vertical, 14)
                    .padding(.horizontal, 32)
                    .background(CSColor.pink)
                    .cornerRadius(CSRadius.button)
                    .shadow(color: CSColor.pink.opacity(0.35), radius: 14, x: 0, y: 4)
            }
        }
        .padding(CSSpacing.xxl)
        .frame(maxWidth: .infinity)
        .background(CSColor.navy)
    }

    // MARK: - Footer

    private var footer: some View {
        Text("Child Spree 2026 · Davis Education Foundation · daviskids.org")
            .csBody(11)
            .foregroundColor(.white.opacity(0.3))
            .padding(CSSpacing.lg)
            .frame(maxWidth: .infinity)
            .background(Color(hex: 0x0F2634))
    }
}
