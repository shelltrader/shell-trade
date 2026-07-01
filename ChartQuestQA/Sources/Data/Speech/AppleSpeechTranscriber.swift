import Foundation
import Speech

public final class AppleSpeechTranscriber: Transcriber, @unchecked Sendable {
    public init() {}

    public func transcribe(fileURL: URL) async throws -> String {
        try await Self.requestAuthorization()
        guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US")),
              recognizer.isAvailable else {
            throw TranscriberError.unavailable
        }

        let request = SFSpeechURLRecognitionRequest(url: fileURL)
        request.shouldReportPartialResults = false
        // Do NOT force on-device: if the on-device model isn't installed it fails
        // outright. Leaving this false lets macOS use whichever path works.
        request.requiresOnDeviceRecognition = false

        let guardBox = ResumeGuard()
        return try await withCheckedThrowingContinuation { continuation in
            recognizer.recognitionTask(with: request) { result, error in
                if let error {
                    if guardBox.tryResume() { continuation.resume(throwing: TranscriberError.failed(error.localizedDescription)) }
                    return
                }
                if let result, result.isFinal {
                    if guardBox.tryResume() { continuation.resume(returning: result.bestTranscription.formattedString) }
                }
            }
        }
    }

    static func requestAuthorization() async throws {
        switch SFSpeechRecognizer.authorizationStatus() {
        case .authorized: return
        case .denied, .restricted: throw TranscriberError.notAuthorized
        default: break
        }
        let status: SFSpeechRecognizerAuthorizationStatus = await withCheckedContinuation { cont in
            SFSpeechRecognizer.requestAuthorization { cont.resume(returning: $0) }
        }
        guard status == .authorized else { throw TranscriberError.notAuthorized }
    }
}

/// Guards a checked continuation from being resumed more than once.
private final class ResumeGuard: @unchecked Sendable {
    private var resumed = false
    private let lock = NSLock()
    func tryResume() -> Bool {
        lock.lock(); defer { lock.unlock() }
        if resumed { return false }
        resumed = true
        return true
    }
}
