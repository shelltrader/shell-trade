import SwiftUI
import AppKit
import UniformTypeIdentifiers

/// Batch screenshot import: drag/drop up to 30 screenshots, give each one a voice
/// note (auto-transcribed, then keyboard-editable), and "Copy to Claude" writes one
/// readable composite PNG per shot into a folder it opens in Finder — drag them all
/// into Claude at once. Everything is grouped under one review id (e.g. CQ-0018).
struct BatchImportView: View {
    @EnvironmentObject private var env: AppEnvironment
    @EnvironmentObject private var windows: WindowManager
    @StateObject private var recorder = AudioRecorder()

    @State private var items: [BatchItem] = []
    @State private var batchSeq = 0
    @State private var batchID = "CQ-…"
    @State private var recordingItemID: String?
    @State private var transcribingItemID: String?
    @State private var dropTargeted = false
    @State private var statusMessage: String?
    @State private var errorMessage: String?

    private let maxItems = 30
    private let imageExts: Set<String> = ["png", "jpg", "jpeg", "heic", "heif", "gif", "tiff", "tif", "bmp", "webp"]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            header
            Divider().overlay(Theme.line)
            list
            if let statusMessage {
                Text(statusMessage).font(.caption).foregroundStyle(Theme.accent2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            if let errorMessage {
                Text(errorMessage).font(.caption).foregroundStyle(.red)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(16)
        .frame(minWidth: 640, minHeight: 600)
        .background(Theme.bg)
        .foregroundStyle(Theme.ink)
        .onDrop(of: [UTType.fileURL], isTargeted: $dropTargeted) { providers in
            handleDrop(providers); return true
        }
        .onAppear {
            if batchSeq == 0 {
                batchSeq = (try? env.reviewRepo.nextSequence()) ?? Int(Date().timeIntervalSince1970)
                batchID = env.fileStore.cqID(batchSeq)
            }
        }
    }

    // MARK: Header

    private var header: some View {
        HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: 2) {
                Text(batchID).font(.system(.title3, design: .monospaced)).bold()
                Text("\(items.count)/\(maxItems) screenshots").font(.caption).foregroundStyle(Theme.inkFaint)
            }
            if let s = env.activeSession { Pill(text: s.name, hex: "#46E0FF") }
            Spacer()
            Button { addImagesPanel() } label: { Label("Add Images…", systemImage: "plus") }
                .buttonStyle(.bordered)
                .disabled(items.count >= maxItems)
            Button { copyToClaude() } label: {
                Label("Copy to Claude (\(items.count))", systemImage: "square.and.arrow.up.on.square")
            }
            .buttonStyle(.borderedProminent).tint(Theme.accent).disabled(items.isEmpty)
        }
    }

    // MARK: List / drop zone

    private var list: some View {
        ScrollView {
            if items.isEmpty {
                VStack(spacing: 10) {
                    Image(systemName: "square.and.arrow.down.on.square")
                        .font(.system(size: 34)).foregroundStyle(Theme.inkFaint)
                    Text("Drag up to \(maxItems) screenshots here")
                        .font(.headline).foregroundStyle(Theme.inkSoft)
                    Text("…or use “Add Images.” Record or type a note under each, then Copy to Claude.")
                        .font(.caption).foregroundStyle(Theme.inkFaint).multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity).frame(height: 300)
                .background(RoundedRectangle(cornerRadius: 12).fill(Theme.surface))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .strokeBorder(style: StrokeStyle(lineWidth: 1.5, dash: [6]))
                        .foregroundColor(dropTargeted ? Theme.accent : Theme.line)
                )
            } else {
                LazyVStack(spacing: 10) {
                    ForEach($items) { $item in
                        BatchRowView(
                            item: $item,
                            index: (items.firstIndex(where: { $0.id == item.id }) ?? 0) + 1,
                            image: env.fileStore.image(at: item.imageRelPath),
                            isRecording: recordingItemID == item.id,
                            isTranscribing: transcribingItemID == item.id,
                            elapsed: recorder.elapsed,
                            onRecord: { toggleRecording(item.id) },
                            onRemove: { remove(item.id) })
                    }
                }
            }
        }
        .overlay(alignment: .top) {
            if dropTargeted && !items.isEmpty {
                Text("Drop to add").font(.caption).padding(.horizontal, 10).padding(.vertical, 5)
                    .background(Capsule().fill(Theme.accent)).foregroundStyle(.black).padding(.top, 6)
            }
        }
    }

    // MARK: Adding images

    private func handleDrop(_ providers: [NSItemProvider]) {
        for provider in providers {
            provider.loadDataRepresentation(forTypeIdentifier: UTType.fileURL.identifier) { data, _ in
                guard let data, let url = URL(dataRepresentation: data, relativeTo: nil) else { return }
                DispatchQueue.main.async { addImage(at: url) }
            }
        }
    }

    private func addImagesPanel() {
        let panel = NSOpenPanel()
        panel.allowsMultipleSelection = true
        panel.canChooseDirectories = false
        panel.allowedContentTypes = [.png, .jpeg, .image, .heic, .gif, .tiff, .bmp]
        panel.message = "Choose up to \(maxItems) screenshots"
        if panel.runModal() == .OK { for url in panel.urls { addImage(at: url) } }
    }

    private func addImage(at url: URL) {
        guard items.count < maxItems else { errorMessage = "Up to \(maxItems) screenshots per batch."; return }
        let ext = url.pathExtension.lowercased()
        guard imageExts.contains(ext) else { errorMessage = "Skipped \(url.lastPathComponent) — not an image."; return }
        let idx = items.count + 1
        let rel = "Screenshots/\(env.fileStore.timestamp())_\(batchID)_\(String(format: "%02d", idx)).\(ext)"
        do {
            try env.fileStore.copyIn(from: url, to: rel)
            items.append(BatchItem(imageRelPath: rel))
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func remove(_ id: String) {
        if recordingItemID == id, recorder.isRecording { _ = recorder.stop(); recordingItemID = nil }
        items.removeAll { $0.id == id }
    }

    // MARK: Per-item voice note

    private func toggleRecording(_ id: String) {
        if recorder.isRecording {
            guard recordingItemID == id else { errorMessage = "Finish the current recording first."; return }
            guard let result = recorder.stop() else { recordingItemID = nil; return }
            recordingItemID = nil
            let rel = env.fileStore.relativePath(for: result.url)
            if let i = items.firstIndex(where: { $0.id == id }) { items[i].audioRelPath = rel }
            transcribingItemID = id
            let url = result.url
            let engine = TranscriberFactory.make(env.settings.engine)
            Task {
                do {
                    let text = try await engine.transcribe(fileURL: url)
                    if let i = items.firstIndex(where: { $0.id == id }) {
                        let existing = items[i].caption.trimmingCharacters(in: .whitespacesAndNewlines)
                        items[i].caption = existing.isEmpty ? text : existing + " " + text
                    }
                } catch {
                    errorMessage = error.localizedDescription
                }
                transcribingItemID = nil
            }
        } else {
            let rel = "Audio/\(env.fileStore.timestamp())_\(batchID)_\(id.prefix(4)).m4a"
            let url = env.fileStore.absoluteURL(for: rel)
            recordingItemID = id
            errorMessage = nil
            Task {
                let ok = await recorder.start(to: url)
                if !ok {
                    errorMessage = "Couldn't start recording. Allow Microphone access in System Settings ▸ Privacy & Security ▸ Microphone, then try again."
                    recordingItemID = nil
                }
            }
        }
    }

    // MARK: Copy to Claude

    private func copyToClaude() {
        guard !items.isEmpty else { errorMessage = "Add some screenshots first."; return }
        let exportItems: [BatchExporter.Item] = items.compactMap { it in
            guard let img = env.fileStore.image(at: it.imageRelPath) else { return nil }
            return BatchExporter.Item(image: img, caption: it.caption)
        }
        guard !exportItems.isEmpty else { errorMessage = "Couldn't read the screenshots."; return }
        do {
            let folder = try BatchExporter.export(items: exportItems, batchID: batchID, into: env.fileStore.exports)
            saveSummaryReview()
            BatchExporter.reveal(folder)
            let n = exportItems.count
            statusMessage = "Wrote \(n) image\(n == 1 ? "" : "s") to \(folder.lastPathComponent). Finder is open — select all and drag the PNGs into Claude (not the .zip)."
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// Claims the CQ id and records the batch in the dashboard (one summary review;
    /// the individual composites live in the export folder).
    private func saveSummaryReview() {
        var notes = ""
        for (i, it) in items.enumerated() {
            let cap = it.caption.trimmingCharacters(in: .whitespacesAndNewlines)
            notes += "\(i + 1). \(cap.isEmpty ? "(no note)" : cap)\n"
        }
        let r = Review(
            id: batchID, seq: batchSeq,
            title: "Batch — \(items.count) screenshot\(items.count == 1 ? "" : "s")",
            category: .other,
            userNotes: notes, transcript: notes,
            originalPath: items.first?.imageRelPath ?? "",
            sessionId: env.activeSession?.id)
        try? env.reviewRepo.save(r)
        env.notifyChanged()
    }
}

// MARK: - Model

private struct BatchItem: Identifiable {
    let id: String = UUID().uuidString
    var imageRelPath: String
    var caption: String = ""
    var audioRelPath: String? = nil
}

// MARK: - Row

private struct BatchRowView: View {
    @Binding var item: BatchItem
    let index: Int
    let image: NSImage?
    let isRecording: Bool
    let isTranscribing: Bool
    let elapsed: TimeInterval
    let onRecord: () -> Void
    let onRemove: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack(alignment: .topLeading) {
                Group {
                    if let image {
                        Image(nsImage: image).resizable().aspectRatio(contentMode: .fit)
                    } else {
                        RoundedRectangle(cornerRadius: 8).fill(Theme.surfaceHi)
                    }
                }
                .frame(width: 150, height: 110)
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.line))
                Text("\(index)")
                    .font(.system(size: 11, weight: .bold))
                    .padding(.horizontal, 6).padding(.vertical, 2)
                    .background(Capsule().fill(Color.black.opacity(0.6)))
                    .foregroundStyle(.white).padding(5)
            }
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Button(action: onRecord) {
                        HStack {
                            Image(systemName: isRecording ? "stop.circle.fill" : "mic.circle.fill")
                            Text(isRecording ? String(format: "Stop (%.0fs)", elapsed) : "Record note")
                        }
                    }
                    .buttonStyle(.bordered).tint(isRecording ? .red : Theme.accent2)
                    if isTranscribing {
                        ProgressView().controlSize(.small)
                        Text("Transcribing…").font(.caption).foregroundStyle(Theme.inkSoft)
                    }
                    Spacer()
                    Button(action: onRemove) { Image(systemName: "xmark.circle.fill") }
                        .buttonStyle(.plain).foregroundStyle(Theme.inkFaint).help("Remove")
                }
                TextEditor(text: $item.caption)
                    .frame(height: 64).font(.system(size: 13)).padding(6)
                    .background(RoundedRectangle(cornerRadius: 8).fill(Theme.surfaceHi))
                    .scrollContentBackground(.hidden)
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.line))
            }
        }
        .padding(10)
        .background(RoundedRectangle(cornerRadius: 10).fill(Theme.surface))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.line))
    }
}
