import Foundation
import AppKit

/// Owns the on-disk folder layout and all path/filename conventions:
///
/// ```
/// ChartQuest QA/
/// ├── Screenshots/      original captures
/// ├── Reviews/          annotated + resolved renders
/// ├── Exports/          markdown / pdf / csv / json
/// ├── Audio/            voice-note recordings
/// └── chartquest_qa.sqlite
/// ```
public final class FileStore: @unchecked Sendable {
    public let root: URL

    public init(root: URL) {
        self.root = root
        try? ensureDirectories()
    }

    /// Default location: ~/Library/Application Support/ChartQuest QA.
    /// We deliberately AVOID ~/Documents: macOS guards Documents with a TCC
    /// permission that is tied to the app's code signature, so an ad-hoc rebuild
    /// would lose access and the app couldn't read its own database. Application
    /// Support needs no such permission.
    public static func defaultRoot() -> URL {
        if let saved = UserDefaults.standard.string(forKey: "cq.rootPath"), !saved.isEmpty {
            return URL(fileURLWithPath: saved, isDirectory: true)
        }
        let fm = FileManager.default
        let base = fm.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? fm.homeDirectoryForCurrentUser.appendingPathComponent("Library/Application Support")
        let root = base.appendingPathComponent("ChartQuest QA", isDirectory: true)

        // One-time migration from the old ~/Documents/ChartQuest QA location.
        let oldRoot = (fm.urls(for: .documentDirectory, in: .userDomainMask).first
            ?? fm.homeDirectoryForCurrentUser.appendingPathComponent("Documents"))
            .appendingPathComponent("ChartQuest QA", isDirectory: true)
        if !fm.fileExists(atPath: root.path), fm.fileExists(atPath: oldRoot.path) {
            try? fm.createDirectory(at: base, withIntermediateDirectories: true)
            try? fm.moveItem(at: oldRoot, to: root)
        }
        return root
    }

    public var screenshots: URL { root.appendingPathComponent("Screenshots", isDirectory: true) }
    public var reviewsDir: URL { root.appendingPathComponent("Reviews", isDirectory: true) }
    public var exports: URL { root.appendingPathComponent("Exports", isDirectory: true) }
    public var audio: URL { root.appendingPathComponent("Audio", isDirectory: true) }
    public var databasePath: String { root.appendingPathComponent("chartquest_qa.sqlite").path }

    public func ensureDirectories() throws {
        for dir in [root, screenshots, reviewsDir, exports, audio] {
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        }
    }

    // MARK: Conventions

    public func cqID(_ seq: Int) -> String { String(format: "CQ-%04d", seq) }

    public func timestamp(_ date: Date = Date()) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd_HH-mm-ss"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f.string(from: date)
    }

    public func screenshotRelativePath(seq: Int, date: Date = Date()) -> String {
        "Screenshots/\(timestamp(date))_\(cqID(seq)).png"
    }
    public func annotatedRelativePath(seq: Int, date: Date = Date()) -> String {
        "Reviews/\(timestamp(date))_\(cqID(seq))_annotated.png"
    }
    public func resolvedRelativePath(seq: Int, date: Date = Date()) -> String {
        "Reviews/\(timestamp(date))_\(cqID(seq))_resolved.png"
    }
    public func audioRelativePath(seq: Int, date: Date = Date()) -> String {
        "Audio/\(timestamp(date))_\(cqID(seq)).m4a"
    }

    // MARK: Resolution + IO

    public func absoluteURL(for relativePath: String) -> URL {
        if relativePath.hasPrefix("/") { return URL(fileURLWithPath: relativePath) }
        return root.appendingPathComponent(relativePath)
    }

    public func relativePath(for url: URL) -> String {
        let rootPath = root.standardizedFileURL.path
        let p = url.standardizedFileURL.path
        if p.hasPrefix(rootPath) {
            return String(p.dropFirst(rootPath.count)).trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        }
        return p
    }

    public func image(at relativePath: String?) -> NSImage? {
        guard let relativePath, !relativePath.isEmpty else { return nil }
        return NSImage(contentsOf: absoluteURL(for: relativePath))
    }

    @discardableResult
    public func writePNG(_ image: NSImage, to relativePath: String) throws -> URL {
        let url = absoluteURL(for: relativePath)
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        guard let tiff = image.tiffRepresentation,
              let rep = NSBitmapImageRep(data: tiff),
              let png = rep.representation(using: .png, properties: [:]) else {
            throw NSError(domain: "FileStore", code: 1, userInfo: [NSLocalizedDescriptionKey: "PNG encode failed"])
        }
        try png.write(to: url)
        return url
    }

    public func copyIn(from source: URL, to relativePath: String) throws {
        let dest = absoluteURL(for: relativePath)
        try FileManager.default.createDirectory(at: dest.deletingLastPathComponent(), withIntermediateDirectories: true)
        if FileManager.default.fileExists(atPath: dest.path) { try FileManager.default.removeItem(at: dest) }
        try FileManager.default.copyItem(at: source, to: dest)
    }
}
