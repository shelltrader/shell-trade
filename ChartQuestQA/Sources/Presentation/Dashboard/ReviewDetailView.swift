import SwiftUI
import AppKit
import UniformTypeIdentifiers

struct ReviewDetailView: View {
    @EnvironmentObject private var env: AppEnvironment
    @EnvironmentObject private var windows: WindowManager
    let reviewID: String

    @State private var review: Review?
    @State private var devNotes = ""
    @State private var transcriptText = ""
    @State private var imageTab = 0
    @State private var analyzing = false
    @State private var banner: String?

    private static let df: DateFormatter = {
        let f = DateFormatter(); f.dateStyle = .medium; f.timeStyle = .short; return f
    }()

    var body: some View {
        ScrollView {
            if let r = review { content(r).padding(20) }
            else { ProgressView().frame(maxWidth: .infinity, minHeight: 300) }
        }
        .background(Theme.bg)
        .onAppear(perform: load)
        .onReceive(NotificationCenter.default.publisher(for: .cqReviewsChanged)) { _ in load() }
        .overlay(alignment: .top) {
            if let banner { Text(banner).font(.caption).padding(8)
                .background(Capsule().fill(Theme.surfaceHi)).padding(.top, 8) }
        }
    }

    private func content(_ r: Review) -> some View {
        VStack(alignment: .leading, spacing: 18) {
            // Header
            HStack(alignment: .firstTextBaseline) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(r.id).font(.system(.headline, design: .monospaced)).foregroundStyle(Theme.inkSoft)
                    Text(r.title.isEmpty ? "\(r.category.title) review" : r.title)
                        .font(.system(size: 20, weight: .bold)).foregroundStyle(Theme.ink)
                }
                Spacer()
                Button { copyForClaude(r) } label: { Label("Copy for Claude", systemImage: "sparkles.rectangle.stack") }
                    .buttonStyle(.bordered).tint(Theme.accent2)
                Menu {
                    Button("Copy fix prompt for Claude") { copyForClaude(r) }
                    Button("Compare versions") { windows.openComparison(review: r) }
                    Menu("Export review") {
                        ForEach(ExportService.Format.allCases) { f in Button(f.title) { exportReview(r, f) } }
                    }
                    Button("Reveal screenshot") { reveal(r.originalPath) }
                    Divider()
                    Button("Delete", role: .destructive) { delete(r) }
                } label: { Image(systemName: "ellipsis.circle") }.menuStyle(.borderlessButton).fixedSize()
            }

            HStack(spacing: 8) {
                r.category.pill; r.priority.pill; if let s = r.severity { s.pill }
                Spacer()
                Text(Self.df.string(from: r.createdAt)).font(.caption).foregroundStyle(Theme.inkFaint)
            }

            imageSection(r)
            statusSection(r)
            voiceNoteSection(r)
            aiSection(r)
            devNotesSection(r)
        }
    }

    // MARK: Voice note / transcript (editable after transcription)

    private func voiceNoteSection(_ r: Review) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("VOICE NOTE / TRANSCRIPT").font(.system(size: 10, weight: .bold)).foregroundStyle(Theme.inkFaint)
            TextEditor(text: $transcriptText).frame(height: 80).font(.system(size: 13)).padding(6)
                .background(RoundedRectangle(cornerRadius: 8).fill(Theme.surface)).scrollContentBackground(.hidden)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.line))
            HStack {
                Text("Edit the transcription by keyboard, then save.").font(.caption2).foregroundStyle(Theme.inkFaint)
                Spacer()
                Button("Save transcript") { saveTranscript() }.buttonStyle(.borderedProminent).tint(Theme.accent)
                    .disabled(transcriptText == (review?.transcript ?? ""))
            }
        }
    }

    private func saveTranscript() {
        guard var r = review else { return }
        r.transcript = transcriptText; r.updatedAt = Date()
        try? env.reviewRepo.save(r); review = r; env.notifyChanged(); banner = "Transcript saved"
    }

    // MARK: Image tabs (Original / Annotated / Resolved)

    private func imageSection(_ r: Review) -> some View {
        let tabs = imageTabs(r)
        return VStack(alignment: .leading, spacing: 8) {
            Picker("", selection: $imageTab) {
                ForEach(tabs.indices, id: \.self) { i in Text(tabs[i].0).tag(i) }
            }.pickerStyle(.segmented).labelsHidden()
            StoredImage(fileStore: env.fileStore, relativePath: tabs[min(imageTab, tabs.count - 1)].1)
                .frame(maxWidth: .infinity).frame(height: 320)
                .background(RoundedRectangle(cornerRadius: 10).fill(Theme.surface))
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.line))
        }
        .onAppear { if r.annotatedPath != nil { imageTab = min(1, imageTabs(r).count - 1) } }
    }

    private func imageTabs(_ r: Review) -> [(String, String?)] {
        var tabs: [(String, String?)] = [("Original", r.originalPath)]
        if r.annotatedPath != nil { tabs.append(("Annotated", r.annotatedPath)) }
        if r.resolvedPath != nil { tabs.append(("Resolved", r.resolvedPath)) }
        return tabs
    }

    // MARK: Status + resolution

    private func statusSection(_ r: Review) -> some View {
        HStack(spacing: 12) {
            Picker("Status", selection: Binding(
                get: { r.status },
                set: { updateStatus($0) })) {
                ForEach(ReviewStatus.allCases) { Label($0.title, systemImage: $0.symbol).tag($0) }
            }.pickerStyle(.segmented).labelsHidden().frame(maxWidth: 320)
            Spacer()
            Button { markResolved(r) } label: { Label("Mark Resolved…", systemImage: "checkmark.seal") }
                .buttonStyle(.bordered).tint(Theme.accent)
        }
    }

    // MARK: AI analysis

    private func aiSection(_ r: Review) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label("AI Analysis", systemImage: "sparkles").font(.headline)
                Spacer()
                Button { Task { await analyze(r) } } label: {
                    HStack { if analyzing { ProgressView().controlSize(.small) }
                        Text(r.analysis == nil ? "Run analysis" : "Re-run") }
                }.buttonStyle(.bordered).disabled(analyzing)
            }
            if let a = r.analysis {
                if !a.summary.isEmpty {
                    Text(a.summary).font(.system(size: 13)).foregroundStyle(Theme.inkSoft)
                        .padding(10).frame(maxWidth: .infinity, alignment: .leading)
                        .background(RoundedRectangle(cornerRadius: 8).fill(Theme.surface))
                }
                ForEach(a.issues) { issue in IssueCard(issue: issue) }
                Text("Model: \(ClaudeModelOption.name(for: a.model))").font(.caption2).foregroundStyle(Theme.inkFaint)
            } else {
                Text("Not analyzed yet. Run analysis to get prioritized issues with fixes.")
                    .font(.caption).foregroundStyle(Theme.inkFaint)
            }
        }
    }

    // MARK: Developer notes

    private func devNotesSection(_ r: Review) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("DEVELOPER NOTES").font(.system(size: 10, weight: .bold)).foregroundStyle(Theme.inkFaint)
            TextEditor(text: $devNotes).frame(height: 100).font(.system(size: 13)).padding(6)
                .background(RoundedRectangle(cornerRadius: 8).fill(Theme.surface)).scrollContentBackground(.hidden)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.line))
            HStack {
                Spacer()
                Button("Save notes") { saveDevNotes() }.buttonStyle(.borderedProminent).tint(Theme.accent)
                    .disabled(devNotes == (review?.developerNotes ?? ""))
            }
        }
    }

    // MARK: Actions

    private func load() {
        review = try? env.reviewRepo.fetch(id: reviewID)
        devNotes = review?.developerNotes ?? ""
        transcriptText = review?.transcript ?? ""
    }

    private func updateStatus(_ status: ReviewStatus) {
        guard var r = review else { return }
        r.status = status; r.updatedAt = Date()
        try? env.reviewRepo.save(r); review = r; env.notifyChanged()
    }

    private func saveDevNotes() {
        guard var r = review else { return }
        r.developerNotes = devNotes; r.updatedAt = Date()
        try? env.reviewRepo.save(r); review = r; env.notifyChanged(); banner = "Notes saved"
    }

    private func markResolved(_ r: Review) {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [.png, .jpeg, .image]
        panel.message = "Pick the screenshot showing the fix"
        guard panel.runModal() == .OK, let url = panel.url else { return }
        let rel = env.fileStore.resolvedRelativePath(seq: r.seq, date: Date())
        do {
            try env.fileStore.copyIn(from: url, to: rel)
            var updated = r
            updated.resolvedPath = rel; updated.status = .resolved; updated.updatedAt = Date()
            try env.reviewRepo.save(updated)
            review = updated; env.notifyChanged(); banner = "Marked resolved"
        } catch { banner = error.localizedDescription }
    }

    private func analyze(_ r: Review) async {
        guard let apiKey = KeychainStore.loadAPIKey(), !apiKey.isEmpty else { banner = "Add a Claude API key in Settings ▸ AI."; return }
        analyzing = true
        let original = try? Data(contentsOf: env.fileStore.absoluteURL(for: r.originalPath))
        let annotated = r.annotatedPath.flatMap { try? Data(contentsOf: env.fileStore.absoluteURL(for: $0)) }
        let req = AnalysisRequest(originalPNG: original, annotatedPNG: annotated,
                                  annotationsSummary: PromptBuilder.annotationsSummary(r.annotations),
                                  transcript: r.transcript, userNotes: r.userNotes, category: r.category,
                                  model: env.settings.model, maxTokens: env.settings.maxTokens,
                                  temperature: env.settings.temperature,
                                  customSystemPrompt: env.settings.customPrompt.isEmpty ? nil : env.settings.customPrompt)
        do {
            let analysis = try await env.aiService.analyze(req, apiKey: apiKey)
            var updated = r
            updated.analysis = analysis; updated.severity = analysis.topSeverity; updated.updatedAt = Date()
            try? env.reviewRepo.save(updated); review = updated; env.notifyChanged()
        } catch { banner = error.localizedDescription }
        analyzing = false
    }

    /// Copies ONE image (annotated screenshot + a text panel with your voice note
    /// and the AI analysis) to the clipboard, so a single paste into a Claude chat
    /// delivers everything at once.
    private func copyForClaude(_ r: Review) {
        let pb = NSPasteboard.general
        pb.clearContents()
        if let composite = ClipboardComposer.compose(review: r, fileStore: env.fileStore),
           let tiff = composite.tiffRepresentation,
           let bitmap = NSBitmapImageRep(data: tiff),
           let png = bitmap.representation(using: .png, properties: [:]) {
            pb.declareTypes([.png, .tiff], owner: nil)
            pb.setData(png, forType: .png)
            pb.setData(tiff, forType: .tiff)
            banner = "Copied — paste into Claude (screenshot + your voice note + analysis, all in one image)."
        } else {
            pb.declareTypes([.string], owner: nil)
            pb.setString(ClipboardComposer.promptText(r), forType: .string)
            banner = "Copied details — paste into Claude."
        }
    }

    private func exportReview(_ r: Review, _ f: ExportService.Format) {
        do {
            let url = try env.exportService.export(reviews: [r], format: f, baseName: "\(r.id)")
            NSWorkspace.shared.activateFileViewerSelecting([url])
        } catch { banner = error.localizedDescription }
    }

    private func delete(_ r: Review) { vmDelete(r.id) }
    private func vmDelete(_ id: String) { try? env.reviewRepo.delete(id: id); env.notifyChanged() }
    private func reveal(_ p: String) { NSWorkspace.shared.activateFileViewerSelecting([env.fileStore.absoluteURL(for: p)]) }
}

// MARK: - Issue card

private struct IssueCard: View {
    let issue: Issue
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack { Text(issue.title).font(.system(size: 14, weight: .semibold)); Spacer(); issue.severity.pill }
            if let c = issue.category { c.pill }
            labeled("Description", issue.description)
            labeled("Why it matters", issue.whyItMatters)
            labeled("Recommended fix", issue.recommendedFix)
            labeled("Dev notes", issue.devNotes)
        }
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 10).fill(Theme.surface))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.line))
        .overlay(alignment: .leading) {
            RoundedRectangle(cornerRadius: 2).fill(Color(hex: issue.severity.hex)).frame(width: 3).padding(.vertical, 8)
        }
    }
    @ViewBuilder private func labeled(_ label: String, _ text: String) -> some View {
        if !text.isEmpty {
            VStack(alignment: .leading, spacing: 2) {
                Text(label.uppercased()).font(.system(size: 9, weight: .bold)).foregroundStyle(Theme.inkFaint)
                Text(text).font(.system(size: 12)).foregroundStyle(Theme.inkSoft)
            }
        }
    }
}
