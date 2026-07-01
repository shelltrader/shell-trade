import Foundation

/// Builds Markdown / PDF / CSV / JSON exports and writes them into Exports/.
public struct ExportService {
    public enum Format: String, CaseIterable, Identifiable, Sendable {
        case markdown, pdf, csv, json
        public var id: String { rawValue }
        public var ext: String { self == .markdown ? "md" : rawValue }
        public var title: String {
            switch self {
            case .markdown: return "Markdown"
            case .pdf: return "PDF"
            case .csv: return "CSV"
            case .json: return "JSON"
            }
        }
    }

    private let fileStore: FileStore
    public init(fileStore: FileStore) { self.fileStore = fileStore }

    private static let display: DateFormatter = {
        let f = DateFormatter(); f.dateStyle = .medium; f.timeStyle = .short; return f
    }()

    // MARK: Builders

    public func markdown(for review: Review) -> String {
        var s = "# \(review.id) — \(review.title.isEmpty ? review.category.title : review.title)\n\n"
        s += "**Category:** \(review.category.title) · **Status:** \(review.status.title) · **Priority:** \(review.priority.title)"
        if let sev = review.severity { s += " · **Severity:** \(sev.title)" }
        s += "  \n**Created:** \(Self.display.string(from: review.createdAt))\n\n"

        if !review.userNotes.isEmpty { s += "## Notes\n\(review.userNotes)\n\n" }
        if !review.transcript.isEmpty { s += "## Voice transcript\n\(review.transcript)\n\n" }

        if let a = review.analysis {
            s += "## AI Analysis\n"
            if !a.summary.isEmpty { s += "**Summary:** \(a.summary)\n\n" }
            for (i, issue) in a.issues.enumerated() {
                s += "### \(i + 1). \(issue.title) [\(issue.severity.title)]\n"
                if !issue.description.isEmpty { s += "**Description:** \(issue.description)\n\n" }
                if !issue.whyItMatters.isEmpty { s += "**Why it matters:** \(issue.whyItMatters)\n\n" }
                if !issue.recommendedFix.isEmpty { s += "**Recommended fix:** \(issue.recommendedFix)\n\n" }
                if !issue.devNotes.isEmpty { s += "**Dev notes:** \(issue.devNotes)\n\n" }
            }
        }
        if !review.developerNotes.isEmpty { s += "## Developer Notes\n\(review.developerNotes)\n\n" }
        s += "---\n_Annotations: \(review.annotations.count) · Voice notes: \(review.voiceNotes.count)_\n"
        return s
    }

    public func markdown(forReviews reviews: [Review], title: String) -> String {
        var s = "# \(title)\n\n_\(reviews.count) reviews · generated \(Self.display.string(from: Date()))_\n\n"
        for r in reviews { s += markdown(for: r) + "\n\n"; s += "<div style=\"page-break-after: always\"></div>\n\n" }
        return s
    }

    public func csv(_ reviews: [Review]) -> String {
        func esc(_ v: String) -> String { "\"" + v.replacingOccurrences(of: "\"", with: "\"\"") + "\"" }
        var rows = ["id,created,category,status,priority,severity,title,issues,user_notes"]
        for r in reviews {
            let cols = [
                r.id,
                Self.display.string(from: r.createdAt),
                r.category.title, r.status.title, r.priority.title,
                r.severity?.title ?? "",
                r.title,
                String(r.analysis?.issues.count ?? 0),
                r.userNotes.replacingOccurrences(of: "\n", with: " ")
            ]
            rows.append(cols.map(esc).joined(separator: ","))
        }
        return rows.joined(separator: "\n")
    }

    public func json(_ reviews: [Review]) throws -> Data {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        return try encoder.encode(reviews)
    }

    // MARK: Writers

    @discardableResult
    public func export(reviews: [Review], format: Format, baseName: String) throws -> URL {
        let safe = baseName.replacingOccurrences(of: "/", with: "-")
        let url = fileStore.exports.appendingPathComponent("\(safe).\(format.ext)")
        try fileStore.ensureDirectories()
        switch format {
        case .markdown:
            try markdown(forReviews: reviews, title: baseName).data(using: .utf8)?.write(to: url)
        case .pdf:
            try PDFRenderer.pdfData(fromMarkdown: markdown(forReviews: reviews, title: baseName)).write(to: url)
        case .csv:
            try csv(reviews).data(using: .utf8)?.write(to: url)
        case .json:
            try json(reviews).write(to: url)
        }
        return url
    }

    @discardableResult
    public func exportMarkdownDocument(_ markdown: String, baseName: String, format: Format) throws -> URL {
        let safe = baseName.replacingOccurrences(of: "/", with: "-")
        let url = fileStore.exports.appendingPathComponent("\(safe).\(format.ext)")
        try fileStore.ensureDirectories()
        switch format {
        case .pdf: try PDFRenderer.pdfData(fromMarkdown: markdown).write(to: url)
        default:   try markdown.data(using: .utf8)?.write(to: url)
        }
        return url
    }
}
