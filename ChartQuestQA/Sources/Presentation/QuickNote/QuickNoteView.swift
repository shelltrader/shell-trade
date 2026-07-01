import SwiftUI

/// Bonus "Quick Notes Mode": after capture, type a note and press Enter to save.
struct QuickNoteView: View {
    @EnvironmentObject private var env: AppEnvironment
    @EnvironmentObject private var windows: WindowManager
    @State private var review: Review
    @State private var note = ""
    @State private var category: Category = .ui
    @State private var priority: Priority = .medium
    @FocusState private var focused: Bool

    init(draft: Review) { _review = State(initialValue: draft) }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            StoredImage(fileStore: env.fileStore, relativePath: review.originalPath)
                .frame(height: 150).frame(maxWidth: .infinity)
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.line))

            HStack { Text(review.id).font(.system(.caption, design: .monospaced)).foregroundStyle(Theme.inkFaint)
                Spacer(); if let s = env.activeSession { Pill(text: s.name, hex: "#46E0FF") } }

            TextField("Type a note, press Enter to save", text: $note)
                .textFieldStyle(.roundedBorder).focused($focused).onSubmit { save() }

            HStack {
                Picker("", selection: $category) { ForEach(Category.allCases) { Text($0.title).tag($0) } }.labelsHidden()
                Picker("", selection: $priority) { ForEach(Priority.allCases) { Text($0.title).tag($0) } }.labelsHidden()
            }

            HStack {
                Button("Open full editor") { windows.closeQuickNote(); windows.openEditor(draft: review) }
                Spacer()
                Button("Save") { save() }.buttonStyle(.borderedProminent).tint(Theme.accent).keyboardShortcut(.defaultAction)
            }
        }
        .padding(16).frame(width: 460).background(Theme.bg).foregroundStyle(Theme.ink)
        .onAppear { focused = true }
    }

    private func save() {
        var r = review
        r.title = note; r.userNotes = note; r.category = category; r.priority = priority; r.updatedAt = Date()
        try? env.reviewRepo.save(r)
        env.notifyChanged()

        if env.settings.autoAnalyze, let apiKey = KeychainStore.loadAPIKey(), !apiKey.isEmpty {
            let original = try? Data(contentsOf: env.fileStore.absoluteURL(for: r.originalPath))
            let req = AnalysisRequest(originalPNG: original, annotatedPNG: nil, annotationsSummary: "",
                                      transcript: "", userNotes: note, category: category,
                                      model: env.settings.model, maxTokens: env.settings.maxTokens,
                                      temperature: env.settings.temperature,
                                      customSystemPrompt: env.settings.customPrompt.isEmpty ? nil : env.settings.customPrompt)
            Task {
                if let analysis = try? await env.aiService.analyze(req, apiKey: apiKey) {
                    var updated = r; updated.analysis = analysis; updated.severity = analysis.topSeverity
                    try? env.reviewRepo.save(updated); env.notifyChanged()
                }
            }
        }
        windows.closeQuickNote()
    }
}
