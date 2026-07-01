import Foundation

/// Inputs for a single-screenshot analysis.
public struct AnalysisRequest: Sendable {
    public var originalPNG: Data?
    public var annotatedPNG: Data?
    public var annotationsSummary: String
    public var transcript: String
    public var userNotes: String
    public var category: Category
    public var model: String
    public var maxTokens: Int
    public var temperature: Double
    public var customSystemPrompt: String?

    public init(originalPNG: Data?, annotatedPNG: Data?, annotationsSummary: String,
                transcript: String, userNotes: String, category: Category,
                model: String, maxTokens: Int, temperature: Double, customSystemPrompt: String? = nil) {
        self.originalPNG = originalPNG; self.annotatedPNG = annotatedPNG
        self.annotationsSummary = annotationsSummary; self.transcript = transcript
        self.userNotes = userNotes; self.category = category
        self.model = model; self.maxTokens = maxTokens; self.temperature = temperature
        self.customSystemPrompt = customSystemPrompt
    }
}

/// Inputs for a whole-session synthesis report.
public struct SessionReportRequest: Sendable {
    public var sessionName: String
    public var reviews: [Review]
    public var model: String
    public var maxTokens: Int

    public init(sessionName: String, reviews: [Review], model: String, maxTokens: Int) {
        self.sessionName = sessionName; self.reviews = reviews
        self.model = model; self.maxTokens = maxTokens
    }
}

public protocol AIAnalyzing: Sendable {
    func analyze(_ request: AnalysisRequest, apiKey: String) async throws -> AIAnalysis
    func sessionReport(_ request: SessionReportRequest, apiKey: String) async throws -> String
}

public enum AIError: LocalizedError {
    case missingKey
    case http(Int, String)
    case empty
    case transport(String)

    public var errorDescription: String? {
        switch self {
        case .missingKey: return "No Claude API key set. Add one in Settings ▸ AI."
        case .http(let code, let body): return "Claude API error \(code): \(body)"
        case .empty: return "Claude returned an empty response."
        case .transport(let m): return "Network error: \(m)"
        }
    }
}
