import SwiftUI
import AppKit

struct SessionReportView: View {
    @EnvironmentObject private var env: AppEnvironment
    @Environment(\.dismiss) private var dismiss
    let markdown: String
    let sessionName: String
    @State private var banner: String?

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                VStack(alignment: .leading) {
                    Text("Session Report").font(.headline)
                    Text(sessionName).font(.caption).foregroundStyle(Theme.inkSoft)
                }
                Spacer()
                Button { copy() } label: { Label("Copy", systemImage: "doc.on.doc") }
                Button { exportReport(.markdown) } label: { Label("Markdown", systemImage: "doc.text") }
                Button { exportReport(.pdf) } label: { Label("PDF", systemImage: "doc.richtext") }
                    .buttonStyle(.borderedProminent).tint(Theme.accent)
                Button("Done") { dismiss() }.keyboardShortcut(.defaultAction)
            }
            .padding(16)
            Divider().overlay(Theme.line)
            ScrollView { MarkdownText(text: markdown).padding(20).frame(maxWidth: .infinity, alignment: .leading) }
            if let banner { Text(banner).font(.caption).foregroundStyle(Theme.accent2).padding(8) }
        }
        .frame(width: 720, height: 640)
        .background(Theme.bg).foregroundStyle(Theme.ink)
    }

    private func copy() {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(markdown, forType: .string)
        banner = "Copied to clipboard"
    }

    private func exportReport(_ format: ExportService.Format) {
        do {
            let name = "SessionReport_\(sessionName.replacingOccurrences(of: " ", with: "_"))"
            let url = try env.exportService.exportMarkdownDocument(markdown, baseName: name, format: format)
            NSWorkspace.shared.activateFileViewerSelecting([url])
            banner = "Saved \(url.lastPathComponent)"
        } catch { banner = error.localizedDescription }
    }
}
