import Foundation

public final class ReviewRepositoryImpl: ReviewRepository, @unchecked Sendable {
    private let db: Database
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    public init(db: Database) { self.db = db }

    // MARK: Sequence

    public func nextSequence() throws -> Int {
        try db.access { c in
            let rows = try c.query("SELECT COALESCE(MAX(seq), 0) + 1 AS next FROM reviews;")
            return rows.first?.int("next") ?? 1
        }
    }

    // MARK: Save (full object graph)

    public func save(_ review: Review) throws {
        try db.access { c in
            try c.transaction {
                try c.run("""
                    INSERT INTO reviews
                        (id, seq, title, category, status, priority, severity, user_notes,
                         developer_notes, transcript, original_path, annotated_path, resolved_path,
                         session_id, created_at, updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                    ON CONFLICT(id) DO UPDATE SET
                        title=excluded.title, category=excluded.category, status=excluded.status,
                        priority=excluded.priority, severity=excluded.severity, user_notes=excluded.user_notes,
                        developer_notes=excluded.developer_notes, transcript=excluded.transcript,
                        original_path=excluded.original_path, annotated_path=excluded.annotated_path,
                        resolved_path=excluded.resolved_path, session_id=excluded.session_id,
                        updated_at=excluded.updated_at;
                    """,
                    [.text(review.id), .int(Int64(review.seq)), .text(review.title),
                     .text(review.category.rawValue), .text(review.status.rawValue),
                     .text(review.priority.rawValue), .opt(review.severity?.rawValue),
                     .text(review.userNotes), .text(review.developerNotes), .text(review.transcript),
                     .text(review.originalPath), .opt(review.annotatedPath), .opt(review.resolvedPath),
                     .opt(review.sessionId), .date(review.createdAt), .date(review.updatedAt)])

                // Replace children
                try c.run("DELETE FROM annotations WHERE review_id = ?;", [.text(review.id)])
                for a in review.annotations {
                    let pointsJSON = (try? encoder.encode(a.points)).flatMap { String(data: $0, encoding: .utf8) }
                    try c.run("""
                        INSERT INTO annotations
                            (id, review_id, tool, x, y, width, height, points, color, line_width, text, created_at)
                        VALUES (?,?,?,?,?,?,?,?,?,?,?,?);
                        """,
                        [.text(a.id), .text(review.id), .text(a.tool.rawValue),
                         .double(a.x), .double(a.y), .double(a.width), .double(a.height),
                         .opt(pointsJSON), .text(a.colorHex), .double(a.lineWidth),
                         .opt(a.text), .date(a.createdAt)])
                }

                try c.run("DELETE FROM voice_notes WHERE review_id = ?;", [.text(review.id)])
                for v in review.voiceNotes {
                    try c.run("""
                        INSERT INTO voice_notes (id, review_id, audio_path, transcript, duration, created_at)
                        VALUES (?,?,?,?,?,?);
                        """,
                        [.text(v.id), .text(review.id), .text(v.audioPath),
                         .text(v.transcript), .double(v.duration), .date(v.createdAt)])
                }

                try c.run("DELETE FROM ai_analyses WHERE review_id = ?;", [.text(review.id)])
                if let analysis = review.analysis {
                    try c.run("""
                        INSERT INTO ai_analyses (id, review_id, model, summary, raw_response, created_at)
                        VALUES (?,?,?,?,?,?);
                        """,
                        [.text(analysis.id), .text(review.id), .text(analysis.model),
                         .text(analysis.summary), .text(analysis.rawResponse), .date(analysis.createdAt)])
                    for issue in analysis.issues {
                        try c.run("""
                            INSERT INTO ai_issues
                                (id, analysis_id, review_id, sort_order, title, severity, category,
                                 description, why_it_matters, recommended_fix, dev_notes)
                            VALUES (?,?,?,?,?,?,?,?,?,?,?);
                            """,
                            [.text(issue.id), .text(analysis.id), .text(review.id),
                             .int(Int64(issue.sortOrder)), .text(issue.title), .text(issue.severity.rawValue),
                             .opt(issue.category?.rawValue), .text(issue.description),
                             .text(issue.whyItMatters), .text(issue.recommendedFix), .text(issue.devNotes)])
                    }
                }
            }
        }
    }

    // MARK: Fetch

    public func fetch(id: String) throws -> Review? {
        try db.access { c in
            guard let row = try c.query("SELECT * FROM reviews WHERE id = ?;", [.text(id)]).first else { return nil }
            return try hydrate(row, c)
        }
    }

    public func fetchAll(filter: ReviewFilter) throws -> [Review] {
        try db.access { c in
            let (clause, params) = Self.whereClause(filter)
            let rows = try c.query("SELECT * FROM reviews \(clause) ORDER BY created_at DESC;", params)
            return try rows.map { try hydrate($0, c) }
        }
    }

    public func count(filter: ReviewFilter) throws -> Int {
        try db.access { c in
            let (clause, params) = Self.whereClause(filter)
            let rows = try c.query("SELECT COUNT(*) AS n FROM reviews \(clause);", params)
            return rows.first?.int("n") ?? 0
        }
    }

    public func delete(id: String) throws {
        try db.access { c in try c.run("DELETE FROM reviews WHERE id = ?;", [.text(id)]) }
    }

    // MARK: Mapping

    private func hydrate(_ row: Row, _ c: SQLiteConnection) throws -> Review {
        let id = row.string("id") ?? ""

        let annotationRows = try c.query("SELECT * FROM annotations WHERE review_id = ? ORDER BY created_at;", [.text(id)])
        let annotations: [Annotation] = annotationRows.map { r in
            var pts: [AnnotationPoint] = []
            if let json = r.string("points"), let data = json.data(using: .utf8) {
                pts = (try? decoder.decode([AnnotationPoint].self, from: data)) ?? []
            }
            return Annotation(
                id: r.string("id") ?? UUID().uuidString,
                tool: ToolType(rawValue: r.string("tool") ?? "circle") ?? .circle,
                x: r.double("x") ?? 0, y: r.double("y") ?? 0,
                width: r.double("width") ?? 0, height: r.double("height") ?? 0,
                points: pts,
                colorHex: r.string("color") ?? "#FF3B30",
                lineWidth: r.double("line_width") ?? 4,
                text: r.string("text"),
                createdAt: r.date("created_at") ?? Date())
        }

        let voiceRows = try c.query("SELECT * FROM voice_notes WHERE review_id = ? ORDER BY created_at;", [.text(id)])
        let voiceNotes: [VoiceNote] = voiceRows.map { r in
            VoiceNote(id: r.string("id") ?? UUID().uuidString,
                      audioPath: r.string("audio_path") ?? "",
                      transcript: r.string("transcript") ?? "",
                      duration: r.double("duration") ?? 0,
                      createdAt: r.date("created_at") ?? Date())
        }

        var analysis: AIAnalysis?
        if let aRow = try c.query("SELECT * FROM ai_analyses WHERE review_id = ? ORDER BY created_at DESC LIMIT 1;", [.text(id)]).first {
            let analysisId = aRow.string("id") ?? ""
            let issueRows = try c.query("SELECT * FROM ai_issues WHERE analysis_id = ? ORDER BY sort_order;", [.text(analysisId)])
            let issues: [Issue] = issueRows.map { r in
                Issue(id: r.string("id") ?? UUID().uuidString,
                      sortOrder: r.int("sort_order") ?? 0,
                      title: r.string("title") ?? "",
                      severity: Severity(rawValue: r.string("severity") ?? "medium") ?? .medium,
                      category: r.string("category").flatMap { Category(rawValue: $0) },
                      description: r.string("description") ?? "",
                      whyItMatters: r.string("why_it_matters") ?? "",
                      recommendedFix: r.string("recommended_fix") ?? "",
                      devNotes: r.string("dev_notes") ?? "")
            }
            analysis = AIAnalysis(id: analysisId, model: aRow.string("model") ?? "",
                                  summary: aRow.string("summary") ?? "",
                                  rawResponse: aRow.string("raw_response") ?? "",
                                  createdAt: aRow.date("created_at") ?? Date(),
                                  issues: issues)
        }

        return Review(
            id: id, seq: row.int("seq") ?? 0, title: row.string("title") ?? "",
            category: Category(rawValue: row.string("category") ?? "other") ?? .other,
            status: ReviewStatus(rawValue: row.string("status") ?? "open") ?? .open,
            priority: Priority(rawValue: row.string("priority") ?? "medium") ?? .medium,
            severity: row.string("severity").flatMap { Severity(rawValue: $0) },
            userNotes: row.string("user_notes") ?? "",
            developerNotes: row.string("developer_notes") ?? "",
            transcript: row.string("transcript") ?? "",
            originalPath: row.string("original_path") ?? "",
            annotatedPath: row.string("annotated_path"),
            resolvedPath: row.string("resolved_path"),
            sessionId: row.string("session_id"),
            createdAt: row.date("created_at") ?? Date(),
            updatedAt: row.date("updated_at") ?? Date(),
            annotations: annotations, voiceNotes: voiceNotes, analysis: analysis)
    }

    // MARK: Dynamic WHERE

    private static func whereClause(_ filter: ReviewFilter) -> (String, [SQLiteValue]) {
        var clauses: [String] = []
        var params: [SQLiteValue] = []

        let keyword = filter.keyword.trimmingCharacters(in: .whitespacesAndNewlines)
        if !keyword.isEmpty {
            let like = "%\(keyword)%"
            clauses.append("""
            (id LIKE ? OR title LIKE ? OR user_notes LIKE ? OR developer_notes LIKE ? OR transcript LIKE ?
              OR EXISTS (SELECT 1 FROM ai_analyses a WHERE a.review_id = reviews.id AND a.summary LIKE ?)
              OR EXISTS (SELECT 1 FROM ai_issues i WHERE i.review_id = reviews.id AND (i.title LIKE ? OR i.description LIKE ?)))
            """)
            params.append(contentsOf: Array(repeating: SQLiteValue.text(like), count: 8))
        }
        if let category = filter.category { clauses.append("category = ?"); params.append(.text(category.rawValue)) }
        if let status = filter.status { clauses.append("status = ?"); params.append(.text(status.rawValue)) }
        if let priority = filter.priority { clauses.append("priority = ?"); params.append(.text(priority.rawValue)) }
        if let sessionId = filter.sessionId { clauses.append("session_id = ?"); params.append(.text(sessionId)) }
        if let from = filter.dateFrom { clauses.append("created_at >= ?"); params.append(.date(from)) }
        if let to = filter.dateTo { clauses.append("created_at <= ?"); params.append(.date(to)) }

        return clauses.isEmpty ? ("", []) : ("WHERE " + clauses.joined(separator: " AND "), params)
    }
}
