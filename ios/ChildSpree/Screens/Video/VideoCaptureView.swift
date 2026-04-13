import SwiftUI
import AVFoundation
import PhotosUI

/// Video capture + upload — mirrors `VideoCapture` in `src/App.jsx:751`.
/// Records up to 60 s via AVFoundation, then offers review → upload → skip.
struct VideoCaptureView: View {
    let token: String
    let childFirst: String
    let onDone: () -> Void

    @EnvironmentObject var lang: Lang
    @StateObject private var recorder = VideoRecorder()
    @State private var phase: Phase = .intro
    @State private var reviewURL: URL?
    @State private var uploadError: String?
    @State private var uploading = false
    @State private var pickerItem: PhotosPickerItem?

    enum Phase { case intro, recording, review, uploading, done }

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
    }

    // MARK: - Intro / chooser

    private var introView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: CSSpacing.lg) {
                VStack(alignment: .leading, spacing: CSSpacing.sm) {
                    Text(lang.t(.videoTitle))
                        .csDisplay(24)
                        .foregroundColor(CSColor.navy)
                    (Text(lang.t(.videoSubtitle1))
                        + Text(" \(childFirst)").foregroundColor(CSColor.pink).bold()
                        + Text(lang.t(.videoSubtitle2)))
                        .csBody(14)
                        .foregroundColor(CSColor.muted)
                }

                Button { Task { await startRecording() } } label: {
                    ChoiceCard(
                        title: lang.t(.recordNow),
                        subtitle: lang.t(.usesCamera),
                        systemImage: "video.fill",
                        tint: CSColor.pink
                    )
                }

                PhotosPicker(selection: $pickerItem, matching: .videos) {
                    ChoiceCard(
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

                Button(lang.t(.skipVideo)) { onDone() }
                    .font(CSFont.body(14, weight: .medium))
                    .foregroundColor(CSColor.muted)
                    .frame(maxWidth: .infinity)
                    .padding(.top, CSSpacing.md)
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
            uploadError = error.localizedDescription
        }
    }

    private func loadPicked(_ item: PhotosPickerItem) async {
        if let data = try? await item.loadTransferable(type: Data.self) {
            let tmp = FileManager.default.temporaryDirectory
                .appendingPathComponent("picked-\(UUID().uuidString).mov")
            try? data.write(to: tmp)
            reviewURL = tmp
            phase = .review
        }
    }

    // MARK: - Recording

    private var recordingView: some View {
        ZStack {
            CameraPreview(session: recorder.session)
                .ignoresSafeArea()

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
                    Button {
                        recorder.flipCamera()
                    } label: {
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
                        .progressViewStyle(.linear)
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
                            .shadow(color: .black.opacity(0.3), radius: 8)
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

    // MARK: - Review

    private var reviewView: some View {
        VStack(spacing: CSSpacing.lg) {
            Text(lang.t(.previewLabel))
                .csSectionHeader()
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
            Button(lang.t(.skipDontInclude)) { onDone() }
                .font(CSFont.body(13))
                .foregroundColor(CSColor.muted)
            if let uploadError {
                Text(uploadError).csBody(13).foregroundColor(CSColor.red)
            }
        }
        .padding(CSSpacing.lg)
    }

    private var uploadingView: some View {
        VStack(spacing: CSSpacing.md) {
            ProgressView().scaleEffect(1.4).tint(CSColor.pink)
            Text(lang.t(.uploadingVideo))
                .csBody(15)
                .foregroundColor(CSColor.muted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var doneView: some View {
        VStack(spacing: CSSpacing.md) {
            Text("✅").font(.system(size: 56))
            Text(lang.t(.videoReceived))
                .csDisplay(24)
                .foregroundColor(CSColor.navy)
            Text("\(lang.t(.videoReceivedMsg)) \(childFirst)\(lang.t(.videoReceivedMsg2))")
                .csBody(14)
                .foregroundColor(CSColor.muted)
                .multilineTextAlignment(.center)
                .padding(.horizontal, CSSpacing.xl)
            PinkButton(title: lang.t(.allDone), isFullWidth: false) { onDone() }
        }
        .padding(.vertical, CSSpacing.xxxl)
        .frame(maxWidth: .infinity)
    }

    // MARK: - Upload

    private func upload() async {
        guard let url = reviewURL else { return }
        uploading = true
        phase = .uploading
        uploadError = nil
        do {
            _ = try await MultipartUpload.uploadVideo(fileURL: url, token: token)
            phase = .done
        } catch {
            uploadError = error.localizedDescription
            phase = .review
        }
        uploading = false
    }
}

private struct ChoiceCard: View {
    let title: String
    let subtitle: String
    let systemImage: String
    let tint: Color

    var body: some View {
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
        .overlay(
            RoundedRectangle(cornerRadius: CSRadius.card).stroke(CSColor.border, lineWidth: 1)
        )
        .cornerRadius(CSRadius.card)
    }
}
