import AppKit
import SwiftUI

/// Orchestrates the capture → editor pipeline. This is the heart of the
/// "screenshot to review in under 10 seconds" workflow.
@MainActor
public final class CaptureCoordinator {
    private let env: AppEnvironment
    private let windows: WindowManager
    private let screenshot = ScreenshotService()

    public init(env: AppEnvironment, windows: WindowManager) {
        self.env = env
        self.windows = windows
    }

    /// Hotkey / menu entry point. Captures a region, then opens the editor
    /// (or the quick-note panel for the fast path).
    public func capture(quickNote: Bool = false) {
        let seq = (try? env.reviewRepo.nextSequence()) ?? Int(Date().timeIntervalSince1970)
        let date = Date()
        let relativePath = env.fileStore.screenshotRelativePath(seq: seq, date: date)
        let url = env.fileStore.absoluteURL(for: relativePath)

        Task { @MainActor in
            guard let _ = await screenshot.captureRegion(to: url) else { return } // user cancelled
            let draft = Review(id: env.fileStore.cqID(seq), seq: seq,
                               originalPath: relativePath,
                               sessionId: env.activeSession?.id,
                               createdAt: date, updatedAt: date)
            if quickNote { windows.openQuickNote(draft: draft) }
            else { windows.openEditor(draft: draft) }
        }
    }
}
