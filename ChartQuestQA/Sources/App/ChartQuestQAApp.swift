import SwiftUI

@main
struct ChartQuestQAApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var controller = AppController()

    var body: some Scene {
        Window("ChartQuest QA", id: "dashboard") {
            DashboardView()
                .environmentObject(controller.env)
                .environmentObject(controller.windows)
                .frame(minWidth: 1000, minHeight: 640)
                .background(OpenWindowBridge(controller: controller))
                .onAppear { controller.start() }
        }
        .windowToolbarStyle(.unified)
        .commands {
            CommandGroup(replacing: .newItem) {
                Button("Capture Region") { AppController.shared?.menuCapture() }
                    .keyboardShortcut("a", modifiers: [.command, .shift])
                Button("Quick Note") { AppController.shared?.menuQuickNote() }
                    .keyboardShortcut("n", modifiers: [.command, .shift])
                Button("Batch Screenshots…") { AppController.shared?.menuBatch() }
                    .keyboardShortcut("b", modifiers: [.command, .shift])
            }
            CommandMenu("Review") {
                Button("Open Dashboard") { AppController.shared?.menuOpenDashboard() }
                    .keyboardShortcut("d", modifiers: [.command, .shift])
                Button("Toggle Floating Panel") { AppController.shared?.menuToggleFloating() }
                    .keyboardShortcut("f", modifiers: [.command, .shift])
            }
        }

        Settings {
            SettingsView()
                .environmentObject(controller.env)
        }
    }
}

/// Captures SwiftUI's `openWindow` action so the menu-bar item can re-open the
/// dashboard after it's been closed.
private struct OpenWindowBridge: View {
    @Environment(\.openWindow) private var openWindow
    let controller: AppController
    var body: some View {
        Color.clear
            .frame(width: 0, height: 0)
            .onAppear { controller.requestOpenDashboard = { openWindow(id: "dashboard") } }
    }
}
