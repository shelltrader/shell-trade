import AppKit
import SwiftUI

/// Owns the menu-bar item, global hotkey, and the capture pipeline. Created once
/// as a @StateObject by the App and exposed as `.shared` for menu commands.
@MainActor
public final class AppController: NSObject, ObservableObject {
    public static var shared: AppController?

    public let env: AppEnvironment
    public let windows: WindowManager
    public let coordinator: CaptureCoordinator
    private var statusItem: NSStatusItem?

    /// Hooks the App sets so menu actions can drive SwiftUI scenes.
    public var requestOpenDashboard: (() -> Void)?

    public override init() {
        let env = AppEnvironment()
        let windows = WindowManager()
        windows.env = env
        self.env = env
        self.windows = windows
        self.coordinator = CaptureCoordinator(env: env, windows: windows)
        super.init()
        AppController.shared = self
    }

    private var started = false
    public func start() {
        guard !started else { return }
        started = true
        setupStatusItem()
        HotKeyManager.shared.onTrigger = { [weak self] in
            Task { @MainActor in self?.coordinator.capture() }
        }
        HotKeyManager.shared.register()
    }

    // MARK: Menu bar

    private func setupStatusItem() {
        let item = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        item.button?.image = NSImage(systemSymbolName: "camera.viewfinder", accessibilityDescription: "ChartQuest QA")
        let menu = NSMenu()
        add(menu, "Capture Region (\(AppInfo.captureHotkeyDisplay))", #selector(menuCapture))
        add(menu, "Quick Note", #selector(menuQuickNote))
        add(menu, "Batch Screenshots… (⌘⇧B)", #selector(menuBatch))
        menu.addItem(.separator())
        add(menu, "Open Dashboard", #selector(menuOpenDashboard))
        add(menu, "Floating Reviews Panel", #selector(menuToggleFloating))
        menu.addItem(.separator())
        add(menu, "Settings…", #selector(menuOpenSettings))
        menu.addItem(.separator())
        add(menu, "Quit ChartQuest QA", #selector(menuQuit))
        item.menu = menu
        statusItem = item
    }

    private func add(_ menu: NSMenu, _ title: String, _ action: Selector) {
        let mi = NSMenuItem(title: title, action: action, keyEquivalent: "")
        mi.target = self
        menu.addItem(mi)
    }

    @objc public func menuCapture() { coordinator.capture() }
    @objc public func menuQuickNote() { coordinator.capture(quickNote: true) }
    @objc public func menuBatch() { NSApp.activate(ignoringOtherApps: true); windows.openBatchImport() }
    @objc public func menuToggleFloating() { windows.toggleFloatingPanel() }
    @objc public func menuOpenDashboard() {
        NSApp.activate(ignoringOtherApps: true)
        if let dashboard = NSApp.windows.first(where: { $0.canBecomeMain && $0.title.contains("ChartQuest") }) {
            dashboard.makeKeyAndOrderFront(nil)
        } else {
            requestOpenDashboard?()
        }
    }
    @objc public func menuOpenSettings() {
        NSApp.activate(ignoringOtherApps: true)
        if !NSApp.sendAction(Selector(("showSettingsWindow:")), to: nil, from: nil) {
            NSApp.sendAction(Selector(("showPreferencesWindow:")), to: nil, from: nil)
        }
    }
    @objc public func menuQuit() { NSApp.terminate(nil) }
}
