import Foundation
import AppKit

/// Captures a screen region using the system `screencapture` tool, which gives
/// the native crosshair selection UI and requires only Screen Recording permission.
public struct ScreenshotService: Sendable {
    public init() {}

    /// Interactive region capture. Returns the saved file URL, or nil if the
    /// user cancelled (Esc) or capture failed.
    public func captureRegion(to url: URL) async -> URL? {
        await run(arguments: ["-i", "-o", "-x", url.path], output: url)
    }

    /// Full-screen capture (used by some bonus flows).
    public func captureFullScreen(to url: URL) async -> URL? {
        await run(arguments: ["-x", url.path], output: url)
    }

    private func run(arguments: [String], output url: URL) async -> URL? {
        await withCheckedContinuation { continuation in
            DispatchQueue.global(qos: .userInitiated).async {
                try? FileManager.default.createDirectory(at: url.deletingLastPathComponent(),
                                                         withIntermediateDirectories: true)
                let process = Process()
                process.executableURL = URL(fileURLWithPath: "/usr/sbin/screencapture")
                process.arguments = arguments
                do {
                    try process.run()
                    process.waitUntilExit()
                } catch {
                    continuation.resume(returning: nil); return
                }
                let exists = FileManager.default.fileExists(atPath: url.path)
                continuation.resume(returning: exists ? url : nil)
            }
        }
    }
}
