import Foundation
import SwiftUI

/// Dependency-injection container. Built once at launch and injected into the
/// SwiftUI environment so every view/view-model shares the same stack.
@MainActor
public final class AppEnvironment: ObservableObject {
    public let settings: AppSettings
    public let fileStore: FileStore
    public let database: Database
    public let reviewRepo: ReviewRepository
    public let sessionRepo: SessionRepository
    public let aiService: AIAnalyzing
    public let exportService: ExportService

    @Published public var activeSession: PlaytestSession?
    @Published public var startupWarning: String?

    public init() {
        let settings = AppSettings()
        self.settings = settings

        let root = settings.rootPath.isEmpty
            ? FileStore.defaultRoot()
            : URL(fileURLWithPath: settings.rootPath, isDirectory: true)
        let store = FileStore(root: root)
        self.fileStore = store

        do {
            self.database = try Database(path: store.databasePath)
        } catch {
            // Fall back to a temp DB so the app still launches; surface a warning.
            let tmp = FileManager.default.temporaryDirectory.appendingPathComponent("chartquest_qa.sqlite").path
            self.database = (try? Database(path: tmp)) ?? AppEnvironment.emergencyDatabase()
            self.startupWarning = "Could not open the database at \(store.databasePath): \(error.localizedDescription). Using a temporary database."
        }

        self.reviewRepo = ReviewRepositoryImpl(db: database)
        self.sessionRepo = SessionRepositoryImpl(db: database)
        self.aiService = ClaudeAIService()
        self.exportService = ExportService(fileStore: store)
        self.activeSession = try? sessionRepo.fetchActive()
    }

    private static func emergencyDatabase() -> Database {
        // Last resort: an in-memory DB. Force-try is acceptable here because
        // ":memory:" cannot fail under normal conditions.
        try! Database(path: ":memory:")
    }

    // MARK: Session control

    public func startSession(named name: String) {
        let session = PlaytestSession(name: name)
        try? sessionRepo.create(session)
        activeSession = session
    }

    public func endActiveSession(reportMarkdown: String?) {
        guard let session = activeSession else { return }
        try? sessionRepo.end(id: session.id, at: Date(), reportMarkdown: reportMarkdown)
        activeSession = nil
    }

    /// Mint the next review id + on-disk paths for a fresh capture.
    public func newReviewDraft(originalRelativePath: String) -> Review {
        let seq = (try? reviewRepo.nextSequence()) ?? Int(Date().timeIntervalSince1970)
        let id = fileStore.cqID(seq)
        return Review(id: id, seq: seq, originalPath: originalRelativePath, sessionId: activeSession?.id)
    }

    public func notifyChanged() {
        NotificationCenter.default.post(name: .cqReviewsChanged, object: nil)
    }
}
