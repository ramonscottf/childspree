import SwiftUI
import AVKit

/// Thin SwiftUI wrapper around AVPlayerViewController for reviewing a
/// just-recorded or just-picked clip.
struct VideoPlayerView: UIViewControllerRepresentable {
    let url: URL

    func makeUIViewController(context: Context) -> AVPlayerViewController {
        let c = AVPlayerViewController()
        c.player = AVPlayer(url: url)
        c.showsPlaybackControls = true
        c.videoGravity = .resizeAspect
        c.player?.play()
        return c
    }

    func updateUIViewController(_ uiViewController: AVPlayerViewController, context: Context) {}
}
