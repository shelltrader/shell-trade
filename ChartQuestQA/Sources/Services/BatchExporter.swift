import Foundation
import AppKit

/// Turns a batch of (screenshot + caption) items into a folder of readable PNGs —
/// ONE self-contained composite per screenshot (the shot on top, your voice-note
/// text below). You drag those PNGs straight into Claude.
///
/// Why a folder of images and not a .zip you paste: a .zip pasted/dropped into Claude
/// is just an opaque attachment — Claude can't see the images inside it. Multiple image
/// FILES, however, attach fine. So this opens the folder with the PNGs selected; a `.zip`
/// is written alongside purely for your own archiving.
public enum BatchExporter {

    public struct Item {
        public let image: NSImage
        public let caption: String
        public init(image: NSImage, caption: String) { self.image = image; self.caption = caption }
    }

    /// Writes every item as `NN_<batchID>.png` into a timestamped folder under `exportsDir`,
    /// plus a `notes.md` summary and a best-effort `.zip`. Returns the folder URL.
    @discardableResult
    public static func export(items: [Item], batchID: String, into exportsDir: URL) throws -> URL {
        let fm = FileManager.default
        let folder = exportsDir.appendingPathComponent("\(batchID)_batch_\(stamp())", isDirectory: true)
        try fm.createDirectory(at: folder, withIntermediateDirectories: true)

        var md = "# \(batchID) — \(items.count) screenshot\(items.count == 1 ? "" : "s")\n\n"
        for (i, item) in items.enumerated() {
            let n = String(format: "%02d", i + 1)
            let header = "\(batchID) · Shot \(i + 1) of \(items.count)"
            if let composite = ClipboardComposer.composeCaptioned(image: item.image, header: header, caption: item.caption),
               let tiff = composite.tiffRepresentation,
               let rep = NSBitmapImageRep(data: tiff),
               let png = rep.representation(using: .png, properties: [:]) {
                try png.write(to: folder.appendingPathComponent("\(n)_\(batchID).png"))
            }
            let cap = item.caption.trimmingCharacters(in: .whitespacesAndNewlines)
            md += "## Shot \(i + 1)\n\(cap.isEmpty ? "(no note)" : cap)\n\n"
        }
        try? md.data(using: .utf8)?.write(to: folder.appendingPathComponent("notes.md"))

        makeZip(of: folder)   // best-effort, for archiving only
        return folder
    }

    /// Opens the folder in Finder with the composite PNGs selected, ready to drag into Claude.
    public static func reveal(_ folder: URL) {
        let pngs = (try? FileManager.default.contentsOfDirectory(at: folder, includingPropertiesForKeys: nil))?
            .filter { $0.pathExtension.lowercased() == "png" }
            .sorted { $0.lastPathComponent < $1.lastPathComponent } ?? []
        if pngs.isEmpty { NSWorkspace.shared.open(folder) }
        else { NSWorkspace.shared.activateFileViewerSelecting(pngs) }
    }

    // MARK: - Helpers

    private static func makeZip(of folder: URL) {
        let zip = folder.appendingPathExtension("zip")
        let p = Process()
        p.executableURL = URL(fileURLWithPath: "/usr/bin/ditto")
        p.arguments = ["-c", "-k", "--sequesterRsrc", "--keepParent", folder.path, zip.path]
        try? p.run(); p.waitUntilExit()
    }

    private static func stamp() -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd_HH-mm-ss"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f.string(from: Date())
    }
}
