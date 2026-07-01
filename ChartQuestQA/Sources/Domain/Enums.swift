import Foundation

// MARK: - Category

/// The kind of issue a review documents.
public enum Category: String, Codable, CaseIterable, Identifiable, Sendable {
    case bug, ui, tutorial, chart, balance, boss, dialogue, art, progression, monetization, other

    public var id: String { rawValue }

    public var title: String {
        switch self {
        case .bug: return "Bug"
        case .ui: return "UI"
        case .tutorial: return "Tutorial"
        case .chart: return "Chart"
        case .balance: return "Balance"
        case .boss: return "Boss"
        case .dialogue: return "Dialogue"
        case .art: return "Art"
        case .progression: return "Progression"
        case .monetization: return "Monetization"
        case .other: return "Other"
        }
    }

    /// SF Symbol used in chips and filters.
    public var symbol: String {
        switch self {
        case .bug: return "ant.fill"
        case .ui: return "rectangle.3.group"
        case .tutorial: return "graduationcap.fill"
        case .chart: return "chart.xyaxis.line"
        case .balance: return "scalemass.fill"
        case .boss: return "crown.fill"
        case .dialogue: return "text.bubble.fill"
        case .art: return "paintpalette.fill"
        case .progression: return "chart.line.uptrend.xyaxis"
        case .monetization: return "creditcard.fill"
        case .other: return "questionmark.circle.fill"
        }
    }

    /// Accent color as hex (`#RRGGBB`).
    public var hex: String {
        switch self {
        case .bug: return "#EF5F66"
        case .ui: return "#46E0FF"
        case .tutorial: return "#16F29A"
        case .chart: return "#5B9DFF"
        case .balance: return "#FFD166"
        case .boss: return "#E879C6"
        case .dialogue: return "#A78BFA"
        case .art: return "#FF9F5B"
        case .progression: return "#2DD4BF"
        case .monetization: return "#F7931A"
        case .other: return "#9FB0CF"
        }
    }
}

// MARK: - Severity

public enum Severity: String, Codable, CaseIterable, Identifiable, Sendable {
    case critical, high, medium, low, info

    public var id: String { rawValue }

    public var title: String {
        switch self {
        case .critical: return "Critical"
        case .high: return "High"
        case .medium: return "Medium"
        case .low: return "Low"
        case .info: return "Info"
        }
    }

    /// Lower = more severe. Drives sorting in reports.
    public var rank: Int {
        switch self {
        case .critical: return 0
        case .high: return 1
        case .medium: return 2
        case .low: return 3
        case .info: return 4
        }
    }

    public var hex: String {
        switch self {
        case .critical: return "#EF4444"
        case .high: return "#F97316"
        case .medium: return "#FFCE5C"
        case .low: return "#46E0FF"
        case .info: return "#9FB0CF"
        }
    }

    /// Maps loose AI text ("Critical", "P1", "blocker") onto a case.
    public static func parse(_ raw: String?) -> Severity {
        guard let raw = raw?.lowercased() else { return .medium }
        if raw.contains("crit") || raw.contains("block") || raw.contains("p0") || raw.contains("p1") { return .critical }
        if raw.contains("high") || raw.contains("major") || raw.contains("p2") { return .high }
        if raw.contains("med") || raw.contains("p3") { return .medium }
        if raw.contains("low") || raw.contains("minor") || raw.contains("p4") { return .low }
        if raw.contains("info") || raw.contains("nit") || raw.contains("polish") { return .info }
        return .medium
    }
}

// MARK: - Status

public enum ReviewStatus: String, Codable, CaseIterable, Identifiable, Sendable {
    case open
    case inProgress = "in_progress"
    case resolved

    public var id: String { rawValue }

    public var title: String {
        switch self {
        case .open: return "Open"
        case .inProgress: return "In Progress"
        case .resolved: return "Resolved"
        }
    }

    public var symbol: String {
        switch self {
        case .open: return "circle"
        case .inProgress: return "circle.bottomhalf.filled"
        case .resolved: return "checkmark.circle.fill"
        }
    }

    public var hex: String {
        switch self {
        case .open: return "#9FB0CF"
        case .inProgress: return "#FFCE5C"
        case .resolved: return "#16F29A"
        }
    }
}

// MARK: - Priority

public enum Priority: String, Codable, CaseIterable, Identifiable, Sendable {
    case critical, high, medium, low

    public var id: String { rawValue }

    public var title: String {
        switch self {
        case .critical: return "Critical"
        case .high: return "High"
        case .medium: return "Medium"
        case .low: return "Low"
        }
    }

    public var rank: Int {
        switch self {
        case .critical: return 0
        case .high: return 1
        case .medium: return 2
        case .low: return 3
        }
    }

    public var hex: String {
        switch self {
        case .critical: return "#EF4444"
        case .high: return "#F97316"
        case .medium: return "#FFCE5C"
        case .low: return "#46E0FF"
        }
    }
}

// MARK: - Annotation tools

public enum ToolType: String, Codable, CaseIterable, Identifiable, Sendable {
    case select
    case circle
    case rectangle
    case arrow
    case pencil
    case highlighter
    case text
    case xMarker
    case eraser

    public var id: String { rawValue }

    public var title: String {
        switch self {
        case .select: return "Select"
        case .circle: return "Circle"
        case .rectangle: return "Rectangle"
        case .arrow: return "Arrow"
        case .pencil: return "Pencil"
        case .highlighter: return "Highlighter"
        case .text: return "Text"
        case .xMarker: return "X Marker"
        case .eraser: return "Eraser"
        }
    }

    public var symbol: String {
        switch self {
        case .select: return "cursorarrow"
        case .circle: return "circle"
        case .rectangle: return "rectangle"
        case .arrow: return "arrow.up.right"
        case .pencil: return "pencil"
        case .highlighter: return "highlighter"
        case .text: return "textformat"
        case .xMarker: return "xmark"
        case .eraser: return "eraser"
        }
    }

    /// Tools that are defined by a freehand point path rather than a bounding rect.
    public var isFreehand: Bool { self == .pencil || self == .highlighter }
}
