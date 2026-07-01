import Foundation

/// Local Whisper transcription via a whisper.cpp command-line binary.
///
/// Configure two paths in Settings ▸ Voice (stored in UserDefaults):
///   • cq.whisperBinaryPath — e.g. /opt/homebrew/bin/whisper-cli
///   • cq.whisperModelPath  — e.g. ~/models/ggml-base.en.bin
///
/// We down-convert the recorded m4a to 16 kHz mono WAV with the system
/// `afconvert`, then run whisper.cpp with `-otxt` and read the transcript.
public final class WhisperTranscriber: Transcriber, @unchecked Sendable {
    public init() {}

    private var binaryPath: String { UserDefaults.standard.string(forKey: "cq.whisperBinaryPath") ?? "/opt/homebrew/bin/whisper-cli" }
    private var modelPath: String {
        let raw = UserDefaults.standard.string(forKey: "cq.whisperModelPath") ?? ""
        return (raw as NSString).expandingTildeInPath
    }

    public func transcribe(fileURL: URL) async throws -> String {
        let binary = binaryPath
        guard FileManager.default.isExecutableFile(atPath: binary) else { throw TranscriberError.toolMissing(binary) }
        guard FileManager.default.fileExists(atPath: modelPath) else { throw TranscriberError.toolMissing(modelPath) }

        let tmp = FileManager.default.temporaryDirectory
        let wav = tmp.appendingPathComponent(UUID().uuidString + ".wav")
        let outBase = tmp.appendingPathComponent(UUID().uuidString)
        defer {
            try? FileManager.default.removeItem(at: wav)
            try? FileManager.default.removeItem(at: outBase.appendingPathExtension("txt"))
        }

        // 1) m4a → 16kHz mono WAV via afconvert (ships with macOS)
        try runProcess("/usr/bin/afconvert",
                       ["-f", "WAVE", "-d", "LEI16@16000", "-c", "1", fileURL.path, wav.path])

        // 2) whisper.cpp → <outBase>.txt
        try runProcess(binary,
                       ["-m", modelPath, "-f", wav.path, "-otxt", "-of", outBase.path, "-nt"])

        let txt = outBase.appendingPathExtension("txt")
        guard let text = try? String(contentsOf: txt, encoding: .utf8) else {
            throw TranscriberError.failed("whisper produced no transcript")
        }
        return text.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func runProcess(_ launchPath: String, _ args: [String]) throws {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: launchPath)
        process.arguments = args
        let errPipe = Pipe()
        process.standardError = errPipe
        process.standardOutput = Pipe()
        try process.run()
        process.waitUntilExit()
        if process.terminationStatus != 0 {
            let data = errPipe.fileHandleForReading.readDataToEndOfFile()
            throw TranscriberError.failed(String(data: data, encoding: .utf8) ?? "exit \(process.terminationStatus)")
        }
    }
}
