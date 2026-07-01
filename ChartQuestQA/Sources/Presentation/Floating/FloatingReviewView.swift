import SwiftUI

/// Bonus "Floating Review Window": an always-on-top panel of recent reviews.
struct FloatingReviewView: View {
    @EnvironmentObject private var env: AppEnvironment
    @State private var reviews: [Review] = []

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text("Reviews").font(.headline)
                Spacer()
                Button { AppController.shared?.menuCapture() } label: { Image(systemName: "camera.viewfinder") }
                    .help("Capture (\(AppInfo.captureHotkeyDisplay))")
                Button { AppController.shared?.menuQuickNote() } label: { Image(systemName: "note.text.badge.plus") }
            }.padding(12)
            Divider().overlay(Theme.line)
            ScrollView {
                LazyVStack(spacing: 6) {
                    ForEach(reviews) { r in
                        Button { open(r) } label: { row(r) }.buttonStyle(.plain)
                    }
                }.padding(10)
            }
        }
        .background(Theme.bg).foregroundStyle(Theme.ink)
        .onAppear(perform: load)
        .onReceive(NotificationCenter.default.publisher(for: .cqReviewsChanged)) { _ in load() }
    }

    private func row(_ r: Review) -> some View {
        HStack(spacing: 8) {
            Circle().fill(Color(hex: r.status.hex)).frame(width: 8, height: 8)
            VStack(alignment: .leading, spacing: 2) {
                Text(r.title.isEmpty ? "\(r.category.title) review" : r.title).font(.system(size: 12, weight: .medium)).lineLimit(1)
                Text(r.id).font(.system(size: 9, design: .monospaced)).foregroundStyle(Theme.inkFaint)
            }
            Spacer()
            if let n = r.analysis?.issues.count, n > 0 { Text("\(n)").font(.caption2).foregroundStyle(Theme.inkSoft) }
        }
        .padding(8)
        .background(RoundedRectangle(cornerRadius: 8).fill(Theme.surface))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.line))
    }

    private func load() {
        reviews = Array(((try? env.reviewRepo.fetchAll(filter: ReviewFilter())) ?? []).prefix(40))
    }

    private func open(_ r: Review) {
        NotificationCenter.default.post(name: .cqOpenReview, object: r.id)
        AppController.shared?.menuOpenDashboard()
    }
}
