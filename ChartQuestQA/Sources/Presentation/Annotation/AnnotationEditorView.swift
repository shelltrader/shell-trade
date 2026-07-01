import SwiftUI
import AppKit

struct AnnotationEditorView: View {
    @EnvironmentObject private var env: AppEnvironment
    @EnvironmentObject private var windows: WindowManager
    @StateObject private var vm: AnnotationViewModel
    @StateObject private var recorder = AudioRecorder()

    @State private var review: Review
    @State private var titleText = ""
    @State private var notes = ""
    @State private var category: Category = .ui
    @State private var priority: Priority = .medium

    @State private var transcript = ""
    @State private var voiceNotes: [VoiceNote] = []
    @State private var isTranscribing = false

    @State private var isAnalyzing = false
    @State private var statusMessage: String?
    @State private var errorMessage: String?

    init(draft: Review, baseImage: NSImage) {
        _review = State(initialValue: draft)
        _vm = StateObject(wrappedValue: AnnotationViewModel(image: baseImage))
    }

    var body: some View {
        VStack(spacing: 0) {
            toolbar
            Divider().overlay(Theme.line)
            HStack(spacing: 0) {
                AnnotationCanvasView(vm: vm)
                    .background(Theme.bg)
                Divider().overlay(Theme.line)
                sidePanel.frame(width: 300)
            }
        }
        .frame(minWidth: 820, minHeight: 600)
        .background(Theme.bg)
        .foregroundStyle(Theme.ink)
        .onAppear {
            category = review.category
            titleText = review.title
        }
        .sheet(item: $vm.textEntry) { entry in
            LabelEntrySheet(initial: entry.text,
                            onCancel: { vm.textEntry = nil },
                            onDone: { text in
                                vm.commitText(AnnotationViewModel.TextEntry(annotationID: entry.annotationID, text: text))
                                vm.textEntry = nil
                            })
        }
    }

    // MARK: Toolbar

    private var toolbar: some View {
        HStack(spacing: 10) {
            ForEach(ToolType.allCases) { t in
                ToolButton(tool: t, selected: vm.tool == t) { vm.tool = t }
            }
            Divider().frame(height: 22).overlay(Theme.line)
            ForEach(AnnotationPalette.colors, id: \.self) { hex in
                ColorSwatch(hex: hex, selected: vm.colorHex == hex) { vm.colorHex = hex }
            }
            Divider().frame(height: 22).overlay(Theme.line)
            HStack(spacing: 4) {
                Image(systemName: "lineweight").foregroundStyle(Theme.inkSoft)
                Slider(value: $vm.lineWidth, in: 1...24).frame(width: 90)
            }
            Spacer()
            iconButton("arrow.uturn.backward", enabled: vm.canUndo) { vm.undo() }
            iconButton("arrow.uturn.forward", enabled: vm.canRedo) { vm.redo() }
            iconButton("trash", enabled: !vm.annotations.isEmpty) { vm.clearAll() }
            Divider().frame(height: 22).overlay(Theme.line)
            iconButton("minus.magnifyingglass") { vm.zoomOut() }
            Button { vm.resetView() } label: { Text("\(Int(vm.zoom * 100))%").font(.caption.monospacedDigit()) }
                .buttonStyle(.plain).foregroundStyle(Theme.inkSoft).frame(width: 42)
            iconButton("plus.magnifyingglass") { vm.zoomIn() }
        }
        .padding(.horizontal, 12).padding(.vertical, 8)
        .background(Theme.surface)
    }

    // MARK: Side panel

    private var sidePanel: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Text(review.id).font(.system(.title3, design: .monospaced)).bold()
                    Spacer()
                    if let s = env.activeSession { Pill(text: s.name, hex: "#46E0FF") }
                }

                field("Title") { TextField("Short summary", text: $titleText).textFieldStyle(.roundedBorder) }

                field("Category") {
                    Picker("", selection: $category) {
                        ForEach(Category.allCases) { Label($0.title, systemImage: $0.symbol).tag($0) }
                    }.labelsHidden()
                }
                field("Priority") {
                    Picker("", selection: $priority) {
                        ForEach(Priority.allCases) { Text($0.title).tag($0) }
                    }.pickerStyle(.segmented).labelsHidden()
                }

                field("Notes") {
                    TextEditor(text: $notes).frame(height: 90)
                        .font(.system(size: 13)).padding(6)
                        .background(RoundedRectangle(cornerRadius: 8).fill(Theme.surfaceHi))
                        .scrollContentBackground(.hidden)
                }

                voiceSection

                if let statusMessage { Text(statusMessage).font(.caption).foregroundStyle(Theme.accent2) }
                if let errorMessage { Text(errorMessage).font(.caption).foregroundStyle(.red) }

                VStack(spacing: 8) {
                    Button(action: analyze) {
                        HStack {
                            if isAnalyzing { ProgressView().controlSize(.small) }
                            Image(systemName: "sparkles")
                            Text(isAnalyzing ? "Analyzing…" : "Analyze Screenshot")
                        }.frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent).tint(Theme.accent).controlSize(.large)
                    .disabled(isAnalyzing)

                    Button(action: { save(thenAnalyze: false); close() }) {
                        Text("Save without AI").frame(maxWidth: .infinity)
                    }.buttonStyle(.bordered).controlSize(.large).disabled(isAnalyzing)
                }
            }
            .padding(16)
        }
        .background(Theme.surface)
    }

    private var voiceSection: some View {
        field("Voice note") {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Button(action: toggleRecording) {
                        HStack {
                            Image(systemName: recorder.isRecording ? "stop.circle.fill" : "mic.circle.fill")
                            Text(recorder.isRecording ? String(format: "Stop (%.0fs)", recorder.elapsed) : "Record Note")
                        }
                    }
                    .buttonStyle(.bordered).tint(recorder.isRecording ? .red : Theme.accent2)
                    if isTranscribing { ProgressView().controlSize(.small); Text("Transcribing…").font(.caption).foregroundStyle(Theme.inkSoft) }
                }
                // Transcript is always editable by keyboard — fix the transcription or type a note by hand.
                VStack(alignment: .leading, spacing: 4) {
                    TextEditor(text: $transcript)
                        .frame(height: 72).font(.system(size: 13)).padding(6)
                        .background(RoundedRectangle(cornerRadius: 8).fill(Theme.surfaceHi))
                        .scrollContentBackground(.hidden)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.line))
                    Text(transcript.isEmpty ? "Record a note above, or type one here."
                                            : "Transcription — edit freely before saving.")
                        .font(.caption2).foregroundStyle(Theme.inkFaint)
                }
            }
        }
    }

    // MARK: Building blocks

    private func field<C: View>(_ label: String, @ViewBuilder _ content: () -> C) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label.uppercased()).font(.system(size: 10, weight: .bold)).foregroundStyle(Theme.inkFaint)
            content()
        }
    }

    private func iconButton(_ symbol: String, enabled: Bool = true, _ action: @escaping () -> Void) -> some View {
        Button(action: action) { Image(systemName: symbol) }
            .buttonStyle(.plain).foregroundStyle(enabled ? Theme.inkSoft : Theme.inkFaint.opacity(0.4))
            .disabled(!enabled).frame(width: 26, height: 24)
    }

    // MARK: Voice actions

    private func toggleRecording() {
        if recorder.isRecording {
            guard let result = recorder.stop() else { return }
            let rel = env.fileStore.audioRelativePath(seq: review.seq, date: Date())
            try? env.fileStore.copyIn(from: result.url, to: rel)
            let note = VoiceNote(audioPath: rel, duration: result.duration)
            let noteID = note.id
            voiceNotes.append(note)
            isTranscribing = true
            let url = env.fileStore.absoluteURL(for: rel)
            let engine = TranscriberFactory.make(env.settings.engine)
            Task {
                do {
                    let text = try await engine.transcribe(fileURL: url)
                    if let idx = voiceNotes.firstIndex(where: { $0.id == noteID }) { voiceNotes[idx].transcript = text }
                    transcript = (transcript + "\n" + text).trimmingCharacters(in: .whitespacesAndNewlines)
                } catch {
                    errorMessage = error.localizedDescription
                }
                isTranscribing = false
            }
        } else {
            let rel = env.fileStore.audioRelativePath(seq: review.seq, date: Date())
            errorMessage = nil
            Task {
                let ok = await recorder.start(to: env.fileStore.absoluteURL(for: rel))
                if !ok {
                    errorMessage = "Couldn't start recording. Allow Microphone access in System Settings ▸ Privacy & Security ▸ Microphone, then try again."
                }
            }
        }
    }

    // MARK: Persistence + AI

    private func buildReview() -> Review {
        var r = review
        r.title = titleText
        r.category = category
        r.priority = priority
        r.userNotes = notes
        r.transcript = transcript
        r.annotations = vm.annotations
        r.voiceNotes = voiceNotes
        r.updatedAt = Date()

        // flatten + persist annotated image
        if !vm.annotations.isEmpty {
            let flattened = vm.flattened()
            let rel = env.fileStore.annotatedRelativePath(seq: r.seq, date: r.createdAt)
            try? env.fileStore.writePNG(flattened, to: rel)
            r.annotatedPath = rel
        }
        return r
    }

    @discardableResult
    private func save(thenAnalyze: Bool) -> Review {
        let r = buildReview()
        try? env.reviewRepo.save(r)
        review = r
        env.notifyChanged()
        return r
    }

    private func analyze() {
        guard let apiKey = KeychainStore.loadAPIKey(), !apiKey.isEmpty else {
            errorMessage = "No Claude API key. Add one in Settings ▸ AI."
            return
        }
        let saved = save(thenAnalyze: true)
        isAnalyzing = true; errorMessage = nil; statusMessage = "Sending to \(ClaudeModelOption.name(for: env.settings.model))…"

        let originalData = try? Data(contentsOf: env.fileStore.absoluteURL(for: saved.originalPath))
        let annotatedData = pngData(vm.flattened())
        let request = AnalysisRequest(
            originalPNG: originalData,
            annotatedPNG: vm.annotations.isEmpty ? nil : annotatedData,
            annotationsSummary: PromptBuilder.annotationsSummary(vm.annotations),
            transcript: transcript, userNotes: notes, category: category,
            model: env.settings.model, maxTokens: env.settings.maxTokens, temperature: env.settings.temperature,
            customSystemPrompt: env.settings.customPrompt.isEmpty ? nil : env.settings.customPrompt)

        Task {
            do {
                let analysis = try await env.aiService.analyze(request, apiKey: apiKey)
                var r = saved
                r.analysis = analysis
                r.severity = analysis.topSeverity
                r.priority = priorityFrom(analysis.topSeverity)
                priority = r.priority
                try? env.reviewRepo.save(r)
                review = r
                env.notifyChanged()
                statusMessage = "Done — \(analysis.issues.count) issue(s) found."
                isAnalyzing = false
                close()
            } catch {
                errorMessage = error.localizedDescription
                statusMessage = nil
                isAnalyzing = false
            }
        }
    }

    private func priorityFrom(_ s: Severity) -> Priority {
        switch s { case .critical: return .critical; case .high: return .high; case .medium: return .medium; default: return .low }
    }

    private func pngData(_ image: NSImage) -> Data? {
        guard let tiff = image.tiffRepresentation, let rep = NSBitmapImageRep(data: tiff) else { return nil }
        return rep.representation(using: .png, properties: [:])
    }

    private func close() {
        if recorder.isRecording { _ = recorder.stop() }
        windows.closeEditor()
    }
}

// MARK: - Toolbar pieces

private struct ToolButton: View {
    let tool: ToolType; let selected: Bool; let action: () -> Void
    var body: some View {
        Button(action: action) {
            Image(systemName: tool.symbol)
                .frame(width: 30, height: 26)
                .background(RoundedRectangle(cornerRadius: 7).fill(selected ? Theme.accent.opacity(0.22) : Color.clear))
                .overlay(RoundedRectangle(cornerRadius: 7).stroke(selected ? Theme.accent : Color.clear, lineWidth: 1))
        }
        .buttonStyle(.plain)
        .foregroundStyle(selected ? Theme.accent : Theme.inkSoft)
        .help(tool.title)
    }
}

private struct ColorSwatch: View {
    let hex: String; let selected: Bool; let action: () -> Void
    var body: some View {
        Button(action: action) {
            Circle().fill(Color(hex: hex)).frame(width: 18, height: 18)
                .overlay(Circle().stroke(Color.white.opacity(selected ? 0.95 : 0.25), lineWidth: selected ? 2 : 1))
        }.buttonStyle(.plain).help(hex)
    }
}

private struct LabelEntrySheet: View {
    let initial: String
    let onCancel: () -> Void
    let onDone: (String) -> Void
    @State private var text: String = ""

    var body: some View {
        VStack(spacing: 14) {
            Text("Label text").font(.headline)
            TextField("Type a label", text: $text)
                .textFieldStyle(.roundedBorder).frame(width: 260)
                .onSubmit { onDone(text) }
            HStack {
                Button("Cancel") { onCancel() }
                Button("Done") { onDone(text) }.keyboardShortcut(.defaultAction)
            }
        }
        .padding(24).frame(width: 320)
        .onAppear { text = initial }
    }
}
