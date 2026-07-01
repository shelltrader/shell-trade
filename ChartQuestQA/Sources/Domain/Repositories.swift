import Foundation

// MARK: - Filtering

/// All search + filter inputs for the dashboard. Empty values mean "no constraint".
public struct ReviewFilter: Equatable, Sendable {
    public var keyword: String = ""
    public var category: Category? = nil
    public var status: ReviewStatus? = nil
    public var priority: Priority? = nil
    public var sessionId: String? = nil
    public var dateFrom: Date? = nil
    public var dateTo: Date? = nil

    public init() {}

    public var isEmpty: Bool {
        keyword.trimmingCharacters(in: .whitespaces).isEmpty &&
        category == nil && status == nil && priority == nil &&
        sessionId == nil && dateFrom == nil && dateTo == nil
    }
}

// MARK: - Repositories (protocols live in Domain; impls live in Data)

public protocol ReviewRepository: AnyObject, Sendable {
    /// Next numeric id used to mint "CQ-XXXX".
    func nextSequence() throws -> Int
    /// Insert or replace a review and all of its child rows (annotations, voice notes, analysis).
    func save(_ review: Review) throws
    func fetch(id: String) throws -> Review?
    func fetchAll(filter: ReviewFilter) throws -> [Review]
    func delete(id: String) throws
    func count(filter: ReviewFilter) throws -> Int
}

public protocol SessionRepository: AnyObject, Sendable {
    func create(_ session: PlaytestSession) throws
    func update(_ session: PlaytestSession) throws
    func end(id: String, at date: Date, reportMarkdown: String?) throws
    func fetch(id: String) throws -> PlaytestSession?
    func fetchActive() throws -> PlaytestSession?
    func fetchAll() throws -> [PlaytestSession]
}
