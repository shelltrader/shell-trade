import SwiftUI

/// Shared visual language — a calm, Linear/Notion-flavoured dark studio tool.
enum Theme {
    static let bg = Color(hex: "#0B0E14")
    static let surface = Color(hex: "#12161F")
    static let surfaceHi = Color(hex: "#1A2030")
    static let line = Color.white.opacity(0.08)
    static let ink = Color(hex: "#EAF1FF")
    static let inkSoft = Color(hex: "#9FB0CF")
    static let inkFaint = Color(hex: "#64789D")
    static let accent = Color(hex: "#16F29A")
    static let accent2 = Color(hex: "#46E0FF")
    static let radius: CGFloat = 12
}

/// A small colored status/severity/priority chip.
struct Pill: View {
    let text: String
    let hex: String
    var filled = false
    var systemImage: String? = nil

    var body: some View {
        HStack(spacing: 5) {
            if let systemImage { Image(systemName: systemImage).font(.system(size: 10, weight: .bold)) }
            Text(text).font(.system(size: 11, weight: .semibold))
        }
        .padding(.horizontal, 9).padding(.vertical, 4)
        .foregroundStyle(filled ? Color.black.opacity(0.85) : Color(hex: hex))
        .background(
            RoundedRectangle(cornerRadius: 7)
                .fill(filled ? Color(hex: hex) : Color(hex: hex).opacity(0.14))
                .overlay(RoundedRectangle(cornerRadius: 7).stroke(Color(hex: hex).opacity(0.35), lineWidth: 1))
        )
    }
}

extension ReviewStatus { var pill: Pill { Pill(text: title, hex: hex, systemImage: symbol) } }
extension Priority { var pill: Pill { Pill(text: title + " priority", hex: hex) } }
extension Severity { var pill: Pill { Pill(text: title, hex: hex, filled: self == .critical) } }
extension Category { var pill: Pill { Pill(text: title, hex: hex, systemImage: symbol) } }

/// Card container.
struct Card<Content: View>: View {
    @ViewBuilder var content: Content
    var body: some View {
        content
            .padding(16)
            .background(RoundedRectangle(cornerRadius: Theme.radius).fill(Theme.surface))
            .overlay(RoundedRectangle(cornerRadius: Theme.radius).stroke(Theme.line, lineWidth: 1))
    }
}

/// Loads an image from a FileStore-relative path.
struct StoredImage: View {
    let fileStore: FileStore
    let relativePath: String?
    var contentMode: ContentMode = .fit

    var body: some View {
        if let image = fileStore.image(at: relativePath) {
            Image(nsImage: image).resizable().aspectRatio(contentMode: contentMode)
        } else {
            ZStack {
                Rectangle().fill(Theme.surfaceHi)
                VStack(spacing: 6) {
                    Image(systemName: "photo").font(.system(size: 22)).foregroundStyle(Theme.inkFaint)
                    Text(relativePath == nil ? "No image" : "Missing file")
                        .font(.caption).foregroundStyle(Theme.inkFaint)
                }
            }
        }
    }
}
