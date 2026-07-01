import SwiftUI

struct ReviewCardView: View {
    @EnvironmentObject private var env: AppEnvironment
    let review: Review
    let selected: Bool

    private static let df: DateFormatter = {
        let f = DateFormatter(); f.dateFormat = "MMM d · HH:mm"; return f
    }()

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            StoredImage(fileStore: env.fileStore,
                        relativePath: review.annotatedPath ?? review.originalPath)
                .frame(width: 84, height: 56)
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.line, lineWidth: 1))

            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    Text(review.id).font(.system(.caption, design: .monospaced)).foregroundStyle(Theme.inkFaint)
                    Spacer()
                    Text(Self.df.string(from: review.createdAt)).font(.caption2).foregroundStyle(Theme.inkFaint)
                }
                Text(review.title.isEmpty ? defaultTitle : review.title)
                    .font(.system(size: 13, weight: .semibold)).lineLimit(2)
                    .foregroundStyle(Theme.ink)
                HStack(spacing: 6) {
                    review.category.pill
                    review.status.pill
                    if let sev = review.severity { sev.pill }
                    if let n = review.analysis?.issues.count, n > 0 {
                        Pill(text: "\(n) issue\(n == 1 ? "" : "s")", hex: "#9FB0CF", systemImage: "sparkles")
                    }
                }
            }
        }
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 10).fill(selected ? Theme.surfaceHi : Theme.surface))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(selected ? Theme.accent.opacity(0.6) : Theme.line, lineWidth: 1))
        .contentShape(Rectangle())
    }

    private var defaultTitle: String {
        review.analysis?.summary.isEmpty == false ? review.analysis!.summary
            : (review.userNotes.isEmpty ? "\(review.category.title) review" : review.userNotes)
    }
}
