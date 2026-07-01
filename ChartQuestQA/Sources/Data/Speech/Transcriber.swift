import Foundation

public enum TranscriberEngine: String, CaseIterable, Identifiable, Sendable {
    case apple
    case whisper
    public var id: String { rawValue }
    public var title: String {
        switch self {
        case .apple: return "Apple Speech (built-in)"
        case .whisper: return "whisper.cpp (local)"
        }
    }
}

public enum TranscriberError: LocalizedError {
    case unavailable
    case notAuthorized
    case toolMissing(String)
    case failed(String)

    public var errorDescription: String? {
        switch self {
        case .unavailable: return "Speech recognition isn't available on this device."
        case .notAuthorized: return "Speech recognition permission was denied. Enable it in System Settings ▸ Privacy."
        case .toolMissing(let p): return "whisper.cpp tool not found at \(p). Set its path in Settings ▸ Voice."
        case .failed(let m): return "Transcription failed: \(m)"
        }
    }
}

public protocol Transcriber: Sendable {
    func transcribe(fileURL: URL) async throws -> String
}

public enum TranscriberFactory {
    public static func make(_ engine: TranscriberEngine) -> Transcriber {
        switch engine {
        case .apple: return AppleSpeechTranscriber()
        case .whisper: return WhisperTranscriber()
        }
    }
}
