import SwiftUI

@MainActor
final class DashboardViewModel: ObservableObject {
    @Published var reviews: [Review] = []
    @Published var filter = ReviewFilter() { didSet { reload() } }
    @Published var selectedID: String?

    private weak var env: AppEnvironment?

    func configure(_ env: AppEnvironment) {
        guard self.env == nil else { return }
        self.env = env
        reload()
    }

    func reload() {
        guard let env else { return }
        reviews = (try? env.reviewRepo.fetchAll(filter: filter)) ?? []
        if selectedID == nil || !reviews.contains(where: { $0.id == selectedID }) {
            selectedID = reviews.first?.id
        }
    }

    var selected: Review? { reviews.first { $0.id == selectedID } }

    // Header stats (respect the current filter)
    var total: Int { reviews.count }
    var openCount: Int { reviews.filter { $0.status == .open }.count }
    var inProgressCount: Int { reviews.filter { $0.status == .inProgress }.count }
    var resolvedCount: Int { reviews.filter { $0.status == .resolved }.count }
    var criticalCount: Int { reviews.filter { $0.severity == .critical || $0.priority == .critical }.count }

    func delete(_ id: String) {
        try? env?.reviewRepo.delete(id: id)
        env?.notifyChanged()
        reload()
    }

    /// Delete the currently-selected review (used by the Delete key).
    func deleteSelected() {
        guard let id = selectedID else { return }
        // advance selection to a neighbour so the detail pane doesn't go blank awkwardly
        if let idx = reviews.firstIndex(where: { $0.id == id }) {
            let next = reviews.indices.contains(idx + 1) ? reviews[idx + 1].id
                     : (idx > 0 ? reviews[idx - 1].id : nil)
            selectedID = next
        }
        delete(id)
    }

    func clearFilters() { filter = ReviewFilter() }
}
