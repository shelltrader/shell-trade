import SwiftUI

/// Bonus "Side-by-side Comparison": Original vs Annotated vs Resolved.
struct ComparisonView: View {
    @EnvironmentObject private var env: AppEnvironment
    let reviewId: String
    @State private var review: Review?

    var body: some View {
        VStack(spacing: 0) {
            if let r = review {
                HStack {
                    Text("\(r.id) — \(r.title.isEmpty ? r.category.title : r.title)").font(.headline)
                    Spacer()
                    r.status.pill
                }.padding(16)
                Divider().overlay(Theme.line)
                HStack(spacing: 14) {
                    column("Original", r.originalPath, hex: "#9FB0CF")
                    column("Annotated", r.annotatedPath, hex: "#46E0FF")
                    column("Resolved", r.resolvedPath, hex: "#16F29A")
                }.padding(16)
            } else {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .background(Theme.bg).foregroundStyle(Theme.ink)
        .onAppear { review = try? env.reviewRepo.fetch(id: reviewId) }
        .onReceive(NotificationCenter.default.publisher(for: .cqReviewsChanged)) { _ in
            review = try? env.reviewRepo.fetch(id: reviewId)
        }
    }

    private func column(_ title: String, _ path: String?, hex: String) -> some View {
        VStack(spacing: 8) {
            Pill(text: title, hex: hex)
            if path != nil {
                StoredImage(fileStore: env.fileStore, relativePath: path)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(RoundedRectangle(cornerRadius: 10).fill(Theme.surface))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.line))
            } else {
                RoundedRectangle(cornerRadius: 10).fill(Theme.surface)
                    .overlay(Text(title == "Resolved" ? "Not resolved yet" : "—").foregroundStyle(Theme.inkFaint))
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.line))
            }
        }.frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
