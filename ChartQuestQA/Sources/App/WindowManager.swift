import AppKit
import SwiftUI

/// Creates and tracks the auxiliary windows (editor, quick note, floating panel,
/// comparison). Injected into the SwiftUI environment so views can open/close them.
@MainActor
public final class WindowManager: ObservableObject {
    public weak var env: AppEnvironment?

    private var editorWindow: NSWindow?
    private var quickNoteWindow: NSWindow?
    private var floatingWindow: NSWindow?
    private var comparisonWindows: [NSWindow] = []
    private var batchWindow: NSWindow?

    public init() {}

    // MARK: Annotation editor

    public func openEditor(draft: Review) {
        guard let env else { return }
        let image = env.fileStore.image(at: draft.originalPath)
            ?? NSImage(size: NSSize(width: 1280, height: 800))
        let view = AnnotationEditorView(draft: draft, baseImage: image)
            .environmentObject(env)
            .environmentObject(self)
        let window = makeWindow(view, title: "Annotate \(draft.id)",
                                size: NSSize(width: 900, height: 680),
                                style: [.titled, .closable, .resizable, .miniaturizable])
        editorWindow?.close()
        editorWindow = window
        present(window)
    }

    public func closeEditor() { editorWindow?.close(); editorWindow = nil }

    // MARK: Quick note

    public func openQuickNote(draft: Review) {
        guard let env else { return }
        let view = QuickNoteView(draft: draft)
            .environmentObject(env)
            .environmentObject(self)
        let window = makeWindow(view, title: "Quick Note — \(draft.id)",
                                size: NSSize(width: 460, height: 360),
                                style: [.titled, .closable])
        window.level = .floating
        quickNoteWindow?.close()
        quickNoteWindow = window
        present(window)
    }

    public func closeQuickNote() { quickNoteWindow?.close(); quickNoteWindow = nil }

    // MARK: Batch screenshot import

    public func openBatchImport() {
        guard let env else { return }
        let view = BatchImportView()
            .environmentObject(env)
            .environmentObject(self)
        let window = makeWindow(view, title: "Batch Screenshots",
                                size: NSSize(width: 720, height: 760),
                                style: [.titled, .closable, .resizable, .miniaturizable])
        batchWindow?.close()
        batchWindow = window
        present(window)
    }

    public func closeBatchImport() { batchWindow?.close(); batchWindow = nil }

    // MARK: Floating review panel (always-on-top)

    public func toggleFloatingPanel() {
        if let floatingWindow {
            floatingWindow.close(); self.floatingWindow = nil; return
        }
        guard let env else { return }
        let view = FloatingReviewView().environmentObject(env).environmentObject(self)
        let window = makeWindow(view, title: "Reviews",
                                size: NSSize(width: 380, height: 560),
                                style: [.titled, .closable, .resizable])
        window.level = .floating
        window.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        floatingWindow = window
        present(window)
    }

    // MARK: Side-by-side comparison

    public func openComparison(review: Review) {
        guard let env else { return }
        let view = ComparisonView(reviewId: review.id).environmentObject(env).environmentObject(self)
        let window = makeWindow(view, title: "Compare — \(review.id)",
                                size: NSSize(width: 1100, height: 640),
                                style: [.titled, .closable, .resizable, .miniaturizable])
        comparisonWindows.append(window)
        present(window)
    }

    // MARK: Helpers

    private func present(_ window: NSWindow) {
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    private func makeWindow<V: View>(_ view: V, title: String, size: NSSize,
                                     style: NSWindow.StyleMask) -> NSWindow {
        let hosting = NSHostingController(rootView: view)
        let window = NSWindow(contentViewController: hosting)
        window.title = title
        window.styleMask = style
        window.setContentSize(size)
        window.isReleasedWhenClosed = false
        window.titlebarAppearsTransparent = false
        window.center()
        return window
    }
}
