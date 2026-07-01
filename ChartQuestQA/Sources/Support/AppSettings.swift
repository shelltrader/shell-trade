import Foundation
import SwiftUI

/// UserDefaults-backed app settings. Published so SwiftUI updates live.
/// (The Claude API key is NOT here — it lives in the Keychain.)
@MainActor
public final class AppSettings: ObservableObject {
    private let defaults = UserDefaults.standard

    @Published public var model: String { didSet { defaults.set(model, forKey: "cq.model") } }
    @Published public var maxTokens: Int { didSet { defaults.set(maxTokens, forKey: "cq.maxTokens") } }
    @Published public var temperature: Double { didSet { defaults.set(temperature, forKey: "cq.temperature") } }
    @Published public var customPrompt: String { didSet { defaults.set(customPrompt, forKey: "cq.customPrompt") } }
    @Published public var engineRaw: String { didSet { defaults.set(engineRaw, forKey: "cq.engine") } }
    @Published public var rootPath: String { didSet { defaults.set(rootPath, forKey: "cq.rootPath") } }
    @Published public var whisperBinaryPath: String { didSet { defaults.set(whisperBinaryPath, forKey: "cq.whisperBinaryPath") } }
    @Published public var whisperModelPath: String { didSet { defaults.set(whisperModelPath, forKey: "cq.whisperModelPath") } }
    @Published public var autoAnalyze: Bool { didSet { defaults.set(autoAnalyze, forKey: "cq.autoAnalyze") } }
    @Published public var hasAPIKey: Bool

    public init() {
        model = defaults.string(forKey: "cq.model") ?? ClaudeModelOption.defaultModel
        maxTokens = defaults.object(forKey: "cq.maxTokens") as? Int ?? 2400
        temperature = defaults.object(forKey: "cq.temperature") as? Double ?? 0.4
        customPrompt = defaults.string(forKey: "cq.customPrompt") ?? ""
        engineRaw = defaults.string(forKey: "cq.engine") ?? TranscriberEngine.apple.rawValue
        rootPath = defaults.string(forKey: "cq.rootPath") ?? ""
        whisperBinaryPath = defaults.string(forKey: "cq.whisperBinaryPath") ?? "/opt/homebrew/bin/whisper-cli"
        whisperModelPath = defaults.string(forKey: "cq.whisperModelPath") ?? ""
        autoAnalyze = defaults.object(forKey: "cq.autoAnalyze") as? Bool ?? false
        hasAPIKey = KeychainStore.hasAPIKey
    }

    public var engine: TranscriberEngine { TranscriberEngine(rawValue: engineRaw) ?? .apple }

    public func setAPIKey(_ key: String) {
        let trimmed = key.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty { KeychainStore.deleteAPIKey() } else { KeychainStore.saveAPIKey(trimmed) }
        hasAPIKey = KeychainStore.hasAPIKey
    }
}
