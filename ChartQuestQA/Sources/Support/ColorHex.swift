import SwiftUI
import AppKit

public extension Color {
    init(hex: String) {
        let (r, g, b, a) = Color.rgba(from: hex)
        self.init(.sRGB, red: r, green: g, blue: b, opacity: a)
    }

    static func rgba(from hex: String) -> (Double, Double, Double, Double) {
        var s = hex.trimmingCharacters(in: .whitespaces)
        if s.hasPrefix("#") { s.removeFirst() }
        var value: UInt64 = 0
        Scanner(string: s).scanHexInt64(&value)
        switch s.count {
        case 8:
            return (Double((value >> 24) & 0xFF) / 255, Double((value >> 16) & 0xFF) / 255,
                    Double((value >> 8) & 0xFF) / 255, Double(value & 0xFF) / 255)
        case 6:
            return (Double((value >> 16) & 0xFF) / 255, Double((value >> 8) & 0xFF) / 255,
                    Double(value & 0xFF) / 255, 1)
        default:
            return (1, 0.23, 0.19, 1) // fallback red
        }
    }
}

public extension NSColor {
    convenience init(hex: String) {
        let (r, g, b, a) = Color.rgba(from: hex)
        self.init(srgbRed: r, green: g, blue: b, alpha: a)
    }
}

/// The annotation color palette offered in the editor.
public enum AnnotationPalette {
    public static let colors: [String] = [
        "#FF3B30", // red
        "#FF9500", // orange
        "#FFCC00", // yellow
        "#16F29A", // green
        "#46E0FF", // cyan
        "#5B9DFF", // blue
        "#E879C6", // magenta
        "#FFFFFF", // white
        "#0A0A0A"  // black
    ]
}
