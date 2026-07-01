import Foundation

public final class SessionRepositoryImpl: SessionRepository, @unchecked Sendable {
    private let db: Database
    public init(db: Database) { self.db = db }

    public func create(_ session: PlaytestSession) throws {
        try db.access { c in
            try c.run("""
                INSERT INTO sessions (id, name, started_at, ended_at, report_markdown)
                VALUES (?,?,?,?,?);
                """,
                [.text(session.id), .text(session.name), .date(session.startedAt),
                 .optDate(session.endedAt), .opt(session.reportMarkdown)])
        }
    }

    public func update(_ session: PlaytestSession) throws {
        try db.access { c in
            try c.run("""
                UPDATE sessions SET name=?, started_at=?, ended_at=?, report_markdown=? WHERE id=?;
                """,
                [.text(session.name), .date(session.startedAt), .optDate(session.endedAt),
                 .opt(session.reportMarkdown), .text(session.id)])
        }
    }

    public func end(id: String, at date: Date, reportMarkdown: String?) throws {
        try db.access { c in
            try c.run("UPDATE sessions SET ended_at=?, report_markdown=? WHERE id=?;",
                      [.date(date), .opt(reportMarkdown), .text(id)])
        }
    }

    public func fetch(id: String) throws -> PlaytestSession? {
        try db.access { c in
            try c.query("SELECT * FROM sessions WHERE id=?;", [.text(id)]).first.map(Self.map)
        }
    }

    public func fetchActive() throws -> PlaytestSession? {
        try db.access { c in
            try c.query("SELECT * FROM sessions WHERE ended_at IS NULL ORDER BY started_at DESC LIMIT 1;").first.map(Self.map)
        }
    }

    public func fetchAll() throws -> [PlaytestSession] {
        try db.access { c in
            try c.query("SELECT * FROM sessions ORDER BY started_at DESC;").map(Self.map)
        }
    }

    private static func map(_ r: Row) -> PlaytestSession {
        PlaytestSession(id: r.string("id") ?? UUID().uuidString,
                        name: r.string("name") ?? "Session",
                        startedAt: r.date("started_at") ?? Date(),
                        endedAt: r.date("ended_at"),
                        reportMarkdown: r.string("report_markdown"))
    }
}
