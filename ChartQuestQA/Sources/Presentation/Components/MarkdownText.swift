import SwiftUI

/// Lightweight Markdown renderer for reports (headings, bullets, inline **bold**).
struct MarkdownText: View {
    let text: String

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            ForEach(Array(text.components(separatedBy: "\n").enumerated()), id: \.offset) { _, line in
                row(line)
            }
        }
    }

    @ViewBuilder
    private func row(_ line: String) -> some View {
        if line.hasPrefix("### ") {
            Text(inline(String(line.dropFirst(4)))).font(.system(size: 13, weight: .bold)).padding(.top, 4)
        } else if line.hasPrefix("## ") {
            Text(inline(String(line.dropFirst(3)))).font(.system(size: 17, weight: .bold))
                .foregroundStyle(Theme.accent).padding(.top, 10)
        } else if line.hasPrefix("# ") {
            Text(inline(String(line.dropFirst(2)))).font(.system(size: 22, weight: .bold)).padding(.bottom, 2)
        } else if line.hasPrefix("- ") || line.hasPrefix("* ") {
            HStack(alignment: .top, spacing: 8) {
                Text("•").foregroundStyle(Theme.accent2)
                Text(inline(String(line.dropFirst(2)))).foregroundStyle(Theme.inkSoft)
            }.font(.system(size: 13))
        } else if line.trimmingCharacters(in: .whitespaces).isEmpty {
            Spacer().frame(height: 4)
        } else {
            Text(inline(line)).font(.system(size: 13)).foregroundStyle(Theme.ink)
        }
    }

    private func inline(_ s: String) -> AttributedString {
        (try? AttributedString(markdown: s)) ?? AttributedString(s)
    }
}
