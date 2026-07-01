import Foundation

/// Builds the ChartQuest-aware prompts. Centralised so prompt tuning is one edit.
public enum PromptBuilder {

    /// Domain context so Claude reviews like a ChartQuest team member, not a generic critic.
    public static let gameContext = """
    ChartQuest is a portrait, mobile-first browser game that teaches crypto trading. \
    A turtle named Shell runs along a LIVE candlestick chart (each candle is a platform) and the \
    player takes SIMULATED trades (long/short, risk %, stop-loss, take-profit, leverage). \
    Progress is gated by a 10-world curriculum (candles → trend → market structure → order blocks → \
    risk → VWAP → leverage → multi-timeframe → chart patterns → confluence). Each world ends in a \
    Guardian boss quiz: The Gambler, False-Breakout Eel, Trend Crab, Structure Serpent, Order-Block \
    Golem, Risk Hydra, VWAP Oracle, Margin King, Timeframe Titan, Confluence Kraken, and the final \
    Market Maker. Players climb 11 ranks (Drifter → Plankton → … → Whale → Leviathan → Trader). \
    Everything is logged in a Trading Journal. The brand voice is calm, dry, risk-management-first \
    (the opposite of hype/"to the moon" crypto culture). Audience: curious beginners 12–65.
    """

    public static func analysisSystemPrompt(custom: String?) -> String {
        if let custom, !custom.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { return custom }
        return """
        You are a senior product designer, UX researcher, and trading-education expert embedded with \
        the ChartQuest team. You review playtest screenshots with a sharp, constructive, studio-quality eye.

        \(gameContext)

        You will receive: the ORIGINAL screenshot, the ANNOTATED screenshot (the playtester circled / \
        marked the exact areas that bother them), a text summary of those annotations, any voice-note \
        transcript, and the playtester's typed notes.

        Rules:
        - Prioritise the ANNOTATED areas first — they are the playtester's actual concern.
        - Be specific and actionable. No filler. Reference what is actually visible.
        - Consider: UX issues, tutorial clarity, chart readability, trading-education accuracy, visual \
          hierarchy, progression pacing, reward design, boss design, retention risks, confusing \
          terminology, and monetization friction.
        - It is fine to return a single issue if that's all that's warranted, or several.

        Respond with STRICT JSON ONLY (no markdown fences, no prose before or after) in this exact shape:
        {
          "summary": "one or two sentence overview of the screenshot's state",
          "issues": [
            {
              "title": "short imperative title",
              "severity": "critical | high | medium | low | info",
              "category": "bug | ui | tutorial | chart | balance | boss | dialogue | art | progression | monetization | other",
              "description": "what the problem is, referencing the annotated area",
              "why_it_matters": "the player/business impact",
              "recommended_fix": "concrete design/UX fix",
              "dev_notes": "implementation guidance for an engineer"
            }
          ]
        }
        """
    }

    public static func analysisUserText(annotationsSummary: String, transcript: String,
                                        userNotes: String, category: Category) -> String {
        var lines: [String] = []
        lines.append("Playtester-selected category: \(category.title)")
        lines.append("")
        lines.append("ANNOTATIONS (areas the playtester marked, in image pixel coordinates):")
        lines.append(annotationsSummary.isEmpty ? "  (none — whole screen)" : annotationsSummary)
        if !transcript.trimmingCharacters(in: .whitespaces).isEmpty {
            lines.append("")
            lines.append("VOICE NOTE TRANSCRIPT:")
            lines.append(transcript)
        }
        if !userNotes.trimmingCharacters(in: .whitespaces).isEmpty {
            lines.append("")
            lines.append("PLAYTESTER TYPED NOTES:")
            lines.append(userNotes)
        }
        lines.append("")
        lines.append("Analyze the attached screenshot(s) now and return the JSON described in the system prompt.")
        return lines.joined(separator: "\n")
    }

    /// Human-readable summary of structured annotations for the prompt.
    public static func annotationsSummary(_ annotations: [Annotation]) -> String {
        guard !annotations.isEmpty else { return "" }
        return annotations.enumerated().map { index, a in
            let loc: String
            if a.tool.isFreehand {
                loc = "freehand path with \(a.points.count) points"
            } else {
                loc = String(format: "at (%.0f, %.0f) size %.0f×%.0f", a.x, a.y, a.width, a.height)
            }
            let text = a.text.map { ", label: \"\($0)\"" } ?? ""
            return "  \(index + 1). \(a.tool.title) \(loc), color \(a.colorHex)\(text)"
        }.joined(separator: "\n")
    }

    // MARK: Session report

    public static let sessionReportSystem = """
    You are the QA lead for ChartQuest synthesising one playtest session into a crisp, prioritised report.

    \(gameContext)

    You will receive the list of every review captured during the session, each with its category, \
    severity, the playtester's notes, and the per-screenshot AI findings.

    Produce a Markdown report with EXACTLY these sections (use ## headers):
    ## Session Summary
    ## Critical Issues
    ## Medium Issues
    ## Minor Issues
    ## Top UX Problems
    ## Top Tutorial Problems
    ## Top Chart Problems
    ## Most Common Issues
    ## Recommended Next Actions

    Be concise and specific. Reference review IDs (e.g. CQ-0007) so the team can jump to them. \
    Under each "Issues" section use bullet points. If a section has nothing, write "_None._".
    Return Markdown only — no code fences around the whole thing.
    """

    public static func sessionReportUserText(sessionName: String, reviews: [Review]) -> String {
        var lines: [String] = ["Session: \(sessionName)", "Reviews captured: \(reviews.count)", ""]
        for r in reviews {
            lines.append("### \(r.id) — \(r.title.isEmpty ? r.category.title : r.title)")
            lines.append("- Category: \(r.category.title) · Priority: \(r.priority.title) · Status: \(r.status.title)")
            if let sev = r.severity { lines.append("- Severity: \(sev.title)") }
            if !r.userNotes.isEmpty { lines.append("- Notes: \(r.userNotes)") }
            if !r.transcript.isEmpty { lines.append("- Voice: \(r.transcript)") }
            if let a = r.analysis {
                if !a.summary.isEmpty { lines.append("- AI summary: \(a.summary)") }
                for issue in a.issues {
                    lines.append("- AI issue [\(issue.severity.title)]: \(issue.title) — \(issue.recommendedFix)")
                }
            }
            lines.append("")
        }
        lines.append("Write the session report now.")
        return lines.joined(separator: "\n")
    }
}
