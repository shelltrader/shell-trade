import Foundation

public extension Notification.Name {
    /// Posted whenever reviews change so open windows can refresh.
    static let cqReviewsChanged = Notification.Name("cq.reviewsChanged")
    /// Posted to ask the dashboard to open a specific review.
    static let cqOpenReview = Notification.Name("cq.openReview")
}

public enum AppInfo {
    public static let name = "ChartQuest QA"
    public static let captureHotkeyDisplay = "⌘⇧A"
}
