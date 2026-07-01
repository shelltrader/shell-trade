import Foundation

// MARK: - Geometry (UI-framework agnostic)

public struct AnnotationPoint: Codable, Hashable, Sendable {
    public var x: Double
    public var y: Double
    public init(x: Double, y: Double) { self.x = x; self.y = y }
}

// MARK: - Annotation

/// A single mark drawn on a screenshot. Geometry is stored in the
/// screenshot's pixel coordinate space so it renders identically at any zoom.
public struct Annotation: Identifiable, Codable, Hashable, Sendable {
    public var id: String
    public var tool: ToolType
    public var x: Double
    public var y: Double
    public var width: Double
    public var height: Double
    public var points: [AnnotationPoint]
    public var colorHex: String
    public var lineWidth: Double
    public var text: String?
    public var createdAt: Date

    public init(id: String = UUID().uuidString,
                tool: ToolType,
                x: Double = 0, y: Double = 0, width: Double = 0, height: Double = 0,
                points: [AnnotationPoint] = [],
                colorHex: String = "#FF3B30",
                lineWidth: Double = 4,
                text: String? = nil,
                createdAt: Date = Date()) {
        self.id = id; self.tool = tool
        self.x = x; self.y = y; self.width = width; self.height = height
        self.points = points; self.colorHex = colorHex; self.lineWidth = lineWidth
        self.text = text; self.createdAt = createdAt
    }
}

// MARK: - Voice note

public struct VoiceNote: Identifiable, Codable, Hashable, Sendable {
    public var id: String
    public var audioPath: String
    public var transcript: String
    public var duration: Double
    public var createdAt: Date

    public init(id: String = UUID().uuidString, audioPath: String, transcript: String = "",
                duration: Double = 0, createdAt: Date = Date()) {
        self.id = id; self.audioPath = audioPath; self.transcript = transcript
        self.duration = duration; self.createdAt = createdAt
    }
}

// MARK: - AI Issue

public struct Issue: Identifiable, Codable, Hashable, Sendable {
    public var id: String
    public var sortOrder: Int
    public var title: String
    public var severity: Severity
    public var category: Category?
    public var description: String
    public var whyItMatters: String
    public var recommendedFix: String
    public var devNotes: String

    public init(id: String = UUID().uuidString, sortOrder: Int = 0, title: String,
                severity: Severity = .medium, category: Category? = nil,
                description: String = "", whyItMatters: String = "",
                recommendedFix: String = "", devNotes: String = "") {
        self.id = id; self.sortOrder = sortOrder; self.title = title
        self.severity = severity; self.category = category; self.description = description
        self.whyItMatters = whyItMatters; self.recommendedFix = recommendedFix; self.devNotes = devNotes
    }
}

// MARK: - AI Analysis

public struct AIAnalysis: Identifiable, Codable, Hashable, Sendable {
    public var id: String
    public var model: String
    public var summary: String
    public var rawResponse: String
    public var createdAt: Date
    public var issues: [Issue]

    public init(id: String = UUID().uuidString, model: String, summary: String = "",
                rawResponse: String = "", createdAt: Date = Date(), issues: [Issue] = []) {
        self.id = id; self.model = model; self.summary = summary
        self.rawResponse = rawResponse; self.createdAt = createdAt; self.issues = issues
    }

    /// Highest severity across all issues — used to auto-suggest review priority.
    public var topSeverity: Severity {
        issues.map(\.severity).min(by: { $0.rank < $1.rank }) ?? .info
    }
}

// MARK: - Review

public struct Review: Identifiable, Codable, Hashable, Sendable {
    public var id: String              // "CQ-0001"
    public var seq: Int
    public var title: String
    public var category: Category
    public var status: ReviewStatus
    public var priority: Priority
    public var severity: Severity?
    public var userNotes: String
    public var developerNotes: String
    public var transcript: String
    public var originalPath: String
    public var annotatedPath: String?
    public var resolvedPath: String?
    public var sessionId: String?
    public var createdAt: Date
    public var updatedAt: Date

    public var annotations: [Annotation]
    public var voiceNotes: [VoiceNote]
    public var analysis: AIAnalysis?

    public init(id: String, seq: Int, title: String = "",
                category: Category = .other, status: ReviewStatus = .open,
                priority: Priority = .medium, severity: Severity? = nil,
                userNotes: String = "", developerNotes: String = "", transcript: String = "",
                originalPath: String, annotatedPath: String? = nil, resolvedPath: String? = nil,
                sessionId: String? = nil, createdAt: Date = Date(), updatedAt: Date = Date(),
                annotations: [Annotation] = [], voiceNotes: [VoiceNote] = [], analysis: AIAnalysis? = nil) {
        self.id = id; self.seq = seq; self.title = title
        self.category = category; self.status = status; self.priority = priority; self.severity = severity
        self.userNotes = userNotes; self.developerNotes = developerNotes; self.transcript = transcript
        self.originalPath = originalPath; self.annotatedPath = annotatedPath; self.resolvedPath = resolvedPath
        self.sessionId = sessionId; self.createdAt = createdAt; self.updatedAt = updatedAt
        self.annotations = annotations; self.voiceNotes = voiceNotes; self.analysis = analysis
    }

    /// Concatenated text the FTS index and keyword search look at.
    public var searchBlob: String {
        var parts = [id, title, userNotes, developerNotes, transcript, category.title, status.title, priority.title]
        if let a = analysis {
            parts.append(a.summary)
            parts.append(contentsOf: a.issues.flatMap { [$0.title, $0.description, $0.recommendedFix] })
        }
        return parts.joined(separator: " ")
    }
}

// MARK: - Playtest session

public struct PlaytestSession: Identifiable, Codable, Hashable, Sendable {
    public var id: String
    public var name: String
    public var startedAt: Date
    public var endedAt: Date?
    public var reportMarkdown: String?

    public init(id: String = UUID().uuidString, name: String, startedAt: Date = Date(),
                endedAt: Date? = nil, reportMarkdown: String? = nil) {
        self.id = id; self.name = name; self.startedAt = startedAt
        self.endedAt = endedAt; self.reportMarkdown = reportMarkdown
    }

    public var isActive: Bool { endedAt == nil }
}
