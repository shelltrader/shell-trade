import Foundation

/// Implements the domain AI protocol with Claude: builds prompts, calls the
/// transport, and parses the strict-JSON issue list into domain entities.
public struct ClaudeAIService: AIAnalyzing {
    private let client = ClaudeClient()
    public init() {}

    public func analyze(_ request: AnalysisRequest, apiKey: String) async throws -> AIAnalysis {
        let system = PromptBuilder.analysisSystemPrompt(custom: request.customSystemPrompt)
        let userText = PromptBuilder.analysisUserText(
            annotationsSummary: request.annotationsSummary,
            transcript: request.transcript,
            userNotes: request.userNotes,
            category: request.category)

        var parts: [ClaudeClient.ContentPart] = []
        if let original = request.originalPNG { parts.append(.text("ORIGINAL screenshot:")); parts.append(.imagePNG(original)) }
        if let annotated = request.annotatedPNG { parts.append(.text("ANNOTATED screenshot:")); parts.append(.imagePNG(annotated)) }
        parts.append(.text(userText))

        let raw = try await client.send(system: system, parts: parts,
                                        model: request.model, maxTokens: request.maxTokens,
                                        temperature: request.temperature, apiKey: apiKey)

        return Self.parse(raw, model: request.model)
    }

    public func sessionReport(_ request: SessionReportRequest, apiKey: String) async throws -> String {
        let userText = PromptBuilder.sessionReportUserText(sessionName: request.sessionName, reviews: request.reviews)
        return try await client.send(system: PromptBuilder.sessionReportSystem,
                                     parts: [.text(userText)],
                                     model: request.model, maxTokens: request.maxTokens,
                                     temperature: 0.3, apiKey: apiKey)
    }

    // MARK: Parsing

    /// Lenient parse: pull the first balanced JSON object out of the response,
    /// even if the model wrapped it in prose or code fences.
    static func parse(_ raw: String, model: String) -> AIAnalysis {
        guard let jsonString = extractJSONObject(from: raw),
              let data = jsonString.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            // Couldn't parse JSON — keep the raw text so nothing is lost.
            return AIAnalysis(model: model, summary: "", rawResponse: raw,
                              issues: [Issue(title: "AI response (unparsed)", severity: .info,
                                             description: raw)])
        }

        let summary = obj["summary"] as? String ?? ""
        var issues: [Issue] = []
        if let rawIssues = obj["issues"] as? [[String: Any]] {
            for (i, dict) in rawIssues.enumerated() {
                let cat = (dict["category"] as? String).flatMap { Category(rawValue: $0.lowercased()) }
                issues.append(Issue(
                    sortOrder: i,
                    title: dict["title"] as? String ?? "Issue \(i + 1)",
                    severity: Severity.parse(dict["severity"] as? String),
                    category: cat,
                    description: dict["description"] as? String ?? "",
                    whyItMatters: dict["why_it_matters"] as? String ?? "",
                    recommendedFix: dict["recommended_fix"] as? String ?? "",
                    devNotes: dict["dev_notes"] as? String ?? ""))
            }
        }
        return AIAnalysis(model: model, summary: summary, rawResponse: raw, issues: issues)
    }

    static func extractJSONObject(from text: String) -> String? {
        guard let start = text.firstIndex(of: "{") else { return nil }
        var depth = 0
        var inString = false
        var escaped = false
        var index = start
        while index < text.endIndex {
            let ch = text[index]
            if inString {
                if escaped { escaped = false }
                else if ch == "\\" { escaped = true }
                else if ch == "\"" { inString = false }
            } else {
                if ch == "\"" { inString = true }
                else if ch == "{" { depth += 1 }
                else if ch == "}" {
                    depth -= 1
                    if depth == 0 { return String(text[start...index]) }
                }
            }
            index = text.index(after: index)
        }
        return nil
    }
}
