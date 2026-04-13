import SwiftUI
import AVFoundation
import PhotosUI

/// Staff-recorded video flow — mirrors `FAVideoPage` in `src/App.jsx:1491`.
/// Entered either from the dashboard nom card ("Record video for this child")
/// or via deep link `#/fa/:token/video/:nominationId`.
///
/// Server endpoint: `POST /api/fa/video/:nominationId` with the `X-FA-Token`
/// header attached. The server returns an upload token that we stream the
/// video to via `/api/upload/:token` just like the parent flow.
struct FAVideoPageView: View {
    let faToken: String?
    let nominationId: String

    @EnvironmentObject var lang: Lang
    @EnvironmentObject var auth: AuthStore
    @Environment(\.dismiss) private var dismiss

    @StateObject private var vm = FAVideoVM()
    @StateObject private var recorder = VideoRecorder()
    @State private var phase: Phase = .intro
    @State private var reviewURL: URL?
    @State private var pickerItem: PhotosPickerItem?

    enum Phase { case intro, recording, review, uploading, done }

    private var effectiveToken: String? { faToken ?? auth.faToken }

    var body: some View {
        ZStack {
            switch phase {
            case .intro:     introView
            case .recording: recordingView
            case .review:    reviewView
            case .uploading: uploadingView
            case .done:      doneView
            }
        }
        .background(CSColor.bg)
        .navigationTitle("Record Video")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button(lang.t(.goBack)) { dismiss() }
            }
        }
        .task { await vm.issueUploadToken(faToken: effectiveToken, nominationId: nominationId) }
    }

    private var introView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: CSSpacing.lg) {
                VStack(alignment: .leading, spacing: CSSpacing.sm) {
                    Text("Record a short video")
                        .csDisplay(22)
                        .foregroundColor(CSColor.navy)
                    if let child = vm.childName {
                        Text("for \(child)")
                            .csBody(14)
                            .foregroundColor(CSColor.muted)
                    }
                    Text("Record up to 60 seconds. The child will see this at the event.")
                        .csBody(13)
                        .foregroundColor(CSColor.muted)
                }

                if let err = vm.error {
                    Text(err).csBody(13).foregroundColor(CSColor.red)
                }

                if vm.uploadToken != nil {
                    Button { Task { await startRecording() } } label: {
                        videoChoice(
                            title: lang.t(.recordNow),
                            subtitle: lang.t(.usesCamera),
                            systemImage: "video.fill",
                            tint: CSColor.pink
                        )
                    }
                    .buttonStyle(.plain)

                    PhotosPicker(selection: $pickerItem, matching: .videos) {
                        videoChoice(
                            title: lang.t(.uploadVideo),
                            subtitle: lang.t(.fromPhone),
                            systemImage: "square.and.arrow.up.fill",
                            tint: CSColor.navy
                        )
                    }
                    .onChange(of: pickerItem) { item in
                        guard let item else { return }
                        Task { await loadPicked(item) }
                    }
                } else if vm.loading {
                    ProgressView().tint(CSColor.pink)
                }
            }
            .padding(CSSpacing.lg)
        }
    }

    private func startRecording() async {
        do {
            try await recorder.prepare()
            phase = .recording
            try await recorder.start()
        } catch {
            vm.error = error.localizedDescription
        }
    }

    private func loadPicked(_ item: PhotosPickerItem) async {
        if let data = try? await item.loadTransferable(type: Data.self) {
            let tmp = FileManager.default.temporaryDirectory
                .appendingPathComponent("fa-\(UUID().uuidString).mov")
            try? data.write(to: tmp)
            reviewURL = tmp
            phase = .review
        }
    }

    private var recordingView: some View {
        ZStack {
            CameraPreview(session: recorder.session).ignoresSafeArea()

            VStack {
                HStack {
                    Button {
                        recorder.cancel()
                        phase = .intro
                    } label: {
                        Label(lang.t(.goBack), systemImage: "chevron.left")
                            .font(CSFont.body(14, weight: .semibold))
                            .foregroundColor(.white)
                            .padding(.vertical, 8)
                            .padding(.horizontal, 14)
                            .background(Color.black.opacity(0.5))
                            .clipShape(Capsule())
                    }
                    Spacer()
                    Button { recorder.flipCamera() } label: {
                        Image(systemName: "arrow.triangle.2.circlepath.camera")
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundColor(.white)
                            .padding(10)
                            .background(Color.black.opacity(0.5))
                            .clipShape(Circle())
                    }
                }
                .padding(CSSpacing.lg)

                Spacer()

                VStack(spacing: CSSpacing.md) {
                    Text("\(Int(recorder.elapsed))s / 60s")
                        .font(CSFont.body(12, weight: .bold))
                        .foregroundColor(.white)
                        .padding(.vertical, 4)
                        .padding(.horizontal, 10)
                        .background(Color.black.opacity(0.55))
                        .clipShape(Capsule())
                    ProgressView(value: recorder.elapsed, total: 60)
                        .tint(CSColor.pink)
                        .padding(.horizontal, CSSpacing.xl)
                    Button {
                        Task {
                            if let url = await recorder.stop() {
                                reviewURL = url
                                phase = .review
                            }
                        }
                    } label: {
                        Text(lang.t(.stopReview))
                            .font(CSFont.body(16, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.vertical, 14)
                            .padding(.horizontal, 32)
                            .background(CSColor.pink)
                            .clipShape(Capsule())
                    }
                }
                .padding(.bottom, CSSpacing.xxl)
            }
        }
        .onReceive(recorder.$elapsed) { elapsed in
            if elapsed >= 60 {
                Task {
                    if let url = await recorder.stop() {
                        reviewURL = url
                        phase = .review
                    }
                }
            }
        }
    }

    private var reviewView: some View {
        VStack(spacing: CSSpacing.lg) {
            Text(lang.t(.previewLabel)).csSectionHeader()
            if let url = reviewURL {
                VideoPlayerView(url: url)
                    .frame(maxWidth: .infinity, maxHeight: 360)
                    .cornerRadius(CSRadius.card)
            }
            HStack(spacing: CSSpacing.md) {
                Button(lang.t(.retake)) {
                    reviewURL = nil
                    phase = .intro
                }
                .font(CSFont.body(14, weight: .semibold))
                .foregroundColor(CSColor.muted)
                PinkButton(title: lang.t(.looksGood), isFullWidth: false) {
                    Task { await upload() }
                }
            }
            if let err = vm.error {
                Text(err).csBody(13).foregroundColor(CSColor.red)
            }
        }
        .padding(CSSpacing.lg)
    }

    private var uploadingView: some View {
        VStack(spacing: CSSpacing.md) {
            ProgressView().scaleEffect(1.4).tint(CSColor.pink)
            Text(lang.t(.uploadingVideo)).csBody(15).foregroundColor(CSColor.muted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var doneView: some View {
        VStack(spacing: CSSpacing.md) {
            Text("✅").font(.system(size: 56))
            Text(lang.t(.videoReceived))
                .csDisplay(24)
                .foregroundColor(CSColor.navy)
            Text("Thanks! The video is saved to this child's nomination.")
                .csBody(14)
                .foregroundColor(CSColor.muted)
                .multilineTextAlignment(.center)
                .padding(.horizontal, CSSpacing.xl)
            PinkButton(title: lang.t(.allDone), isFullWidth: false) { dismiss() }
        }
        .padding(.vertical, CSSpacing.xxxl)
        .frame(maxWidth: .infinity)
    }

    private func upload() async {
        guard let url = reviewURL, let token = vm.uploadToken else { return }
        phase = .uploading
        vm.error = nil
        do {
            _ = try await MultipartUpload.uploadVideo(fileURL: url, token: token)
            phase = .done
        } catch {
            vm.error = error.localizedDescription
            phase = .review
        }
    }

    @ViewBuilder
    private func videoChoice(title: String, subtitle: String, systemImage: String, tint: Color) -> some View {
        HStack(spacing: CSSpacing.md) {
            Image(systemName: systemImage)
                .font(.system(size: 22, weight: .semibold))
                .foregroundColor(.white)
                .frame(width: 44, height: 44)
                .background(tint)
                .clipShape(Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(CSFont.body(16, weight: .semibold))
                    .foregroundColor(CSColor.text)
                Text(subtitle)
                    .font(CSFont.body(12))
                    .foregroundColor(CSColor.muted)
            }
            Spacer()
            Image(systemName: "chevron.right").foregroundColor(CSColor.light)
        }
        .padding(CSSpacing.md)
        .background(CSColor.card)
        .overlay(RoundedRectangle(cornerRadius: CSRadius.card).stroke(CSColor.border, lineWidth: 1))
        .cornerRadius(CSRadius.card)
    }
}

@MainActor
final class FAVideoVM: ObservableObject {
    @Published var uploadToken: String?
    @Published var childName: String?
    @Published var loading = false
    @Published var error: String?

    struct FAVideoResponse: Decodable {
        let uploadToken: String
        let childFirst: String?
        let childLast: String?
    }

    func issueUploadToken(faToken: String?, nominationId: String) async {
        guard let faToken else {
            error = "Not signed in."
            return
        }
        loading = true
        error = nil
        defer { loading = false }
        do {
            let resp = try await APIClient.shared.request(
                .faVideo(nominationId: nominationId),
                as: FAVideoResponse.self,
                headers: ["X-FA-Token": faToken]
            )
            self.uploadToken = resp.uploadToken
            if let f = resp.childFirst, let l = resp.childLast {
                self.childName = "\(f) \(l)"
            }
        } catch {
            self.error = error.localizedDescription
        }
    }
}
