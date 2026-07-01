import Foundation
import AVFoundation

/// Records a voice note to an m4a file. UI-driven start/stop.
@MainActor
public final class AudioRecorder: NSObject, ObservableObject {
    @Published public private(set) var isRecording = false
    @Published public private(set) var elapsed: TimeInterval = 0

    private var recorder: AVAudioRecorder?
    private var timer: Timer?
    private(set) var outputURL: URL?

    public override init() { super.init() }

    public static func requestPermission() async -> Bool {
        await withCheckedContinuation { cont in
            switch AVCaptureDevice.authorizationStatus(for: .audio) {
            case .authorized: cont.resume(returning: true)
            case .notDetermined:
                AVCaptureDevice.requestAccess(for: .audio) { cont.resume(returning: $0) }
            default: cont.resume(returning: false)
            }
        }
    }

    /// Begins recording to `url`. Returns false if permission/setup failed.
    @discardableResult
    public func start(to url: URL) async -> Bool {
        guard await Self.requestPermission() else { return false }
        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 44_100,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]
        do {
            try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            let recorder = try AVAudioRecorder(url: url, settings: settings)
            recorder.isMeteringEnabled = true
            guard recorder.record() else { return false }
            self.recorder = recorder
            self.outputURL = url
            self.isRecording = true
            self.elapsed = 0
            self.timer = Timer.scheduledTimer(withTimeInterval: 0.2, repeats: true) { [weak self] _ in
                Task { @MainActor in self?.elapsed = self?.recorder?.currentTime ?? 0 }
            }
            return true
        } catch {
            return false
        }
    }

    /// Stops recording and returns (fileURL, duration).
    @discardableResult
    public func stop() -> (url: URL, duration: TimeInterval)? {
        guard let recorder, let url = outputURL else { return nil }
        let duration = recorder.currentTime
        recorder.stop()
        timer?.invalidate(); timer = nil
        self.recorder = nil
        isRecording = false
        return (url, duration)
    }
}
