import AVFoundation
import Combine
import UIKit

/// AVFoundation-backed video recorder. Matches web MediaRecorder semantics:
/// up to 60 seconds, front/back camera flip, output as `.mov` (H.264 + AAC).
@MainActor
final class VideoRecorder: NSObject, ObservableObject {
    let session = AVCaptureSession()
    @Published var elapsed: TimeInterval = 0
    @Published var isRecording: Bool = false

    private var videoInput: AVCaptureDeviceInput?
    private var audioInput: AVCaptureDeviceInput?
    private let movieOutput = AVCaptureMovieFileOutput()
    private var currentPosition: AVCaptureDevice.Position = .front
    private var timerCancellable: Cancellable?
    private var finishContinuation: CheckedContinuation<URL?, Never>?
    private var outputURL: URL?

    enum RecorderError: Error, LocalizedError {
        case noDevice
        case permissionDenied
        var errorDescription: String? {
            switch self {
            case .noDevice: return "No camera available"
            case .permissionDenied: return "Camera/microphone permission denied"
            }
        }
    }

    // MARK: - Permission + setup

    func prepare() async throws {
        try await requestPermission(for: .video)
        try await requestPermission(for: .audio)
        configureSession()
    }

    private func requestPermission(for type: AVMediaType) async throws {
        switch AVCaptureDevice.authorizationStatus(for: type) {
        case .authorized: return
        case .notDetermined:
            let granted = await AVCaptureDevice.requestAccess(for: type)
            if !granted { throw RecorderError.permissionDenied }
        default:
            throw RecorderError.permissionDenied
        }
    }

    private func configureSession() {
        session.beginConfiguration()
        session.sessionPreset = .high

        // Remove any prior inputs
        session.inputs.forEach { session.removeInput($0) }
        session.outputs.forEach { session.removeOutput($0) }

        // Video
        if let camera = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: currentPosition),
           let input = try? AVCaptureDeviceInput(device: camera),
           session.canAddInput(input) {
            session.addInput(input)
            self.videoInput = input
        }
        // Audio
        if let mic = AVCaptureDevice.default(for: .audio),
           let input = try? AVCaptureDeviceInput(device: mic),
           session.canAddInput(input) {
            session.addInput(input)
            self.audioInput = input
        }
        // Output
        if session.canAddOutput(movieOutput) {
            session.addOutput(movieOutput)
            if let conn = movieOutput.connection(with: .video) {
                if conn.isVideoStabilizationSupported { conn.preferredVideoStabilizationMode = .auto }
                conn.videoOrientation = .portrait
            }
        }

        session.commitConfiguration()
        if !session.isRunning {
            DispatchQueue.global(qos: .userInitiated).async { [session] in
                session.startRunning()
            }
        }
    }

    // MARK: - Camera flip

    func flipCamera() {
        currentPosition = (currentPosition == .front) ? .back : .front
        configureSession()
    }

    // MARK: - Start / stop

    func start() async throws {
        let filename = "cs-video-\(UUID().uuidString).mov"
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(filename)
        outputURL = url
        elapsed = 0
        isRecording = true
        movieOutput.startRecording(to: url, recordingDelegate: self)

        timerCancellable = Timer.publish(every: 0.1, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                guard let self, self.isRecording else { return }
                self.elapsed += 0.1
            }
    }

    func stop() async -> URL? {
        guard isRecording else { return outputURL }
        return await withCheckedContinuation { continuation in
            finishContinuation = continuation
            movieOutput.stopRecording()
        }
    }

    func cancel() {
        if movieOutput.isRecording { movieOutput.stopRecording() }
        isRecording = false
        elapsed = 0
        outputURL = nil
        timerCancellable?.cancel()
    }
}

extension VideoRecorder: AVCaptureFileOutputRecordingDelegate {
    nonisolated func fileOutput(
        _ output: AVCaptureFileOutput,
        didFinishRecordingTo outputFileURL: URL,
        from connections: [AVCaptureConnection],
        error: Error?
    ) {
        Task { @MainActor in
            self.isRecording = false
            self.timerCancellable?.cancel()
            let url: URL? = (error == nil) ? outputFileURL : nil
            self.finishContinuation?.resume(returning: url)
            self.finishContinuation = nil
        }
    }
}
