import SwiftUI
import AppKit

struct SettingsView: View {
    @EnvironmentObject private var env: AppEnvironment

    var body: some View {
        TabView {
            aiTab.tabItem { Label("AI", systemImage: "sparkles") }
            voiceTab.tabItem { Label("Voice", systemImage: "mic") }
            storageTab.tabItem { Label("Storage", systemImage: "externaldrive") }
        }
        .frame(width: 560, height: 470)
        .padding(18)
    }

    // MARK: AI

    @State private var apiKeyField = ""
    @State private var savedNote = false

    private var aiTab: some View {
        Form {
            Section("Claude API key") {
                HStack {
                    SecureField(env.settings.hasAPIKey ? "•••••••• (stored in Keychain)" : "sk-ant-…", text: $apiKeyField)
                    Button("Save") {
                        env.settings.setAPIKey(apiKeyField); apiKeyField = ""
                        savedNote = true; DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { savedNote = false }
                    }.disabled(apiKeyField.isEmpty)
                    if env.settings.hasAPIKey {
                        Button("Remove") { env.settings.setAPIKey("") }.foregroundStyle(.red)
                    }
                }
                Text(savedNote ? "Saved to Keychain." :
                     (env.settings.hasAPIKey ? "A key is set. It's stored only in your macOS Keychain." :
                      "Get a key at console.anthropic.com. It never leaves your Keychain."))
                    .font(.caption).foregroundStyle(savedNote ? Theme.accent : Theme.inkSoft)
            }
            Section("Model") {
                Picker("Model", selection: Binding(get: { env.settings.model }, set: { env.settings.model = $0 })) {
                    ForEach(ClaudeModelOption.all) { Text("\($0.name) — \($0.blurb)").tag($0.id) }
                }
                Stepper("Max tokens: \(env.settings.maxTokens)",
                        value: Binding(get: { env.settings.maxTokens }, set: { env.settings.maxTokens = $0 }),
                        in: 600...8000, step: 200)
                HStack {
                    Text("Temperature: \(env.settings.temperature, specifier: "%.2f")")
                    Slider(value: Binding(get: { env.settings.temperature }, set: { env.settings.temperature = $0 }), in: 0...1)
                }
            }
            Section("Custom analysis prompt (optional)") {
                TextEditor(text: Binding(get: { env.settings.customPrompt }, set: { env.settings.customPrompt = $0 }))
                    .frame(height: 90).font(.system(size: 12, design: .monospaced))
                Text("Leave empty to use the built-in ChartQuest-aware prompt.")
                    .font(.caption).foregroundStyle(Theme.inkSoft)
            }
        }.formStyle(.grouped)
    }

    // MARK: Voice

    private var voiceTab: some View {
        Form {
            Section("Engine") {
                Picker("Transcription", selection: Binding(
                    get: { env.settings.engine },
                    set: { env.settings.engineRaw = $0.rawValue })) {
                    ForEach(TranscriberEngine.allCases) { Text($0.title).tag($0) }
                }
                Toggle("Auto-analyze Quick Notes", isOn: Binding(
                    get: { env.settings.autoAnalyze }, set: { env.settings.autoAnalyze = $0 }))
            }
            if env.settings.engine == .whisper {
                Section("whisper.cpp paths") {
                    TextField("Binary path", text: Binding(
                        get: { env.settings.whisperBinaryPath }, set: { env.settings.whisperBinaryPath = $0 }))
                    TextField("Model path (ggml-*.bin)", text: Binding(
                        get: { env.settings.whisperModelPath }, set: { env.settings.whisperModelPath = $0 }))
                    Text("Install: `brew install whisper-cpp`, then download a ggml model. Audio is converted to WAV with the system afconvert.")
                        .font(.caption).foregroundStyle(Theme.inkSoft)
                }
            } else {
                Section {
                    Text("Apple Speech runs on-device on macOS 14+. First use prompts for Speech Recognition permission.")
                        .font(.caption).foregroundStyle(Theme.inkSoft)
                }
            }
        }.formStyle(.grouped)
    }

    // MARK: Storage

    @State private var storageNote: String?

    private var storageTab: some View {
        Form {
            Section("Data folder") {
                Text(env.settings.rootPath.isEmpty ? FileStore.defaultRoot().path : env.settings.rootPath)
                    .font(.system(size: 12, design: .monospaced)).foregroundStyle(Theme.inkSoft).lineLimit(2)
                HStack {
                    Button("Change…") { chooseFolder() }
                    Button("Reveal in Finder") {
                        NSWorkspace.shared.activateFileViewerSelecting([env.fileStore.root])
                    }
                }
                if let storageNote { Text(storageNote).font(.caption).foregroundStyle(Theme.accent2) }
                Text("Holds Screenshots/, Reviews/, Exports/, Audio/ and the SQLite database. Changing the folder takes effect after restarting the app.")
                    .font(.caption).foregroundStyle(Theme.inkSoft)
            }
            Section("About") {
                LabeledContent("App", value: AppInfo.name)
                LabeledContent("Capture hotkey", value: AppInfo.captureHotkeyDisplay)
            }
        }.formStyle(.grouped)
    }

    private func chooseFolder() {
        let panel = NSOpenPanel()
        panel.canChooseDirectories = true; panel.canChooseFiles = false; panel.canCreateDirectories = true
        if panel.runModal() == .OK, let url = panel.url {
            env.settings.rootPath = url.path
            storageNote = "Saved. Restart the app to use the new folder."
        }
    }
}
