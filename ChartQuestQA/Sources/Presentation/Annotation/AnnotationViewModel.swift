import SwiftUI
import AppKit

/// State + interaction logic for the annotation canvas. All geometry is kept in
/// the screenshot's pixel coordinate space; the view converts to/from screen space.
@MainActor
final class AnnotationViewModel: ObservableObject {
    @Published var annotations: [Annotation] = []
    @Published var tool: ToolType = .circle
    @Published var colorHex: String = AnnotationPalette.colors[0]
    @Published var lineWidth: Double = 5
    @Published var zoom: CGFloat = 1
    @Published var panOffset: CGSize = .zero
    @Published var selectedID: String?
    @Published private(set) var draft: Annotation?

    /// Drives the text-entry sheet.
    @Published var textEntry: TextEntry?
    struct TextEntry: Identifiable { let id = UUID(); var annotationID: String; var text: String }

    let baseImage: NSImage
    let pixelSize: CGSize

    private var undoStack: [[Annotation]] = []
    private var redoStack: [[Annotation]] = []

    // transient drag state
    private enum Mode { case none, draw, move, resize(Corner), pan, erase }
    private enum Corner { case tl, tr, bl, br }
    private var mode: Mode = .none
    private var dragStart: CGPoint = .zero
    private var original: Annotation?
    private var panStart: CGSize = .zero

    init(image: NSImage) {
        self.baseImage = image
        self.pixelSize = Self.pixelSize(of: image)
    }

    static func pixelSize(of image: NSImage) -> CGSize {
        if let rep = image.representations.compactMap({ $0 as? NSBitmapImageRep }).first {
            return CGSize(width: rep.pixelsWide, height: rep.pixelsHigh)
        }
        return image.size == .zero ? CGSize(width: 1280, height: 800) : image.size
    }

    /// All annotations including the in-progress draft, for rendering.
    var renderList: [Annotation] { draft.map { annotations + [$0] } ?? annotations }

    // MARK: Undo / redo

    var canUndo: Bool { !undoStack.isEmpty }
    var canRedo: Bool { !redoStack.isEmpty }

    private var didSnapshot = false
    private func snapshot() {
        undoStack.append(annotations)
        if undoStack.count > 100 { undoStack.removeFirst() }
        redoStack.removeAll()
    }
    /// Snapshot at most once per drag, lazily, so no-op clicks don't pollute history.
    private func ensureSnapshot() { if !didSnapshot { snapshot(); didSnapshot = true } }
    func undo() {
        guard let prev = undoStack.popLast() else { return }
        redoStack.append(annotations); annotations = prev; selectedID = nil
    }
    func redo() {
        guard let next = redoStack.popLast() else { return }
        undoStack.append(annotations); annotations = next; selectedID = nil
    }
    func clearAll() { guard !annotations.isEmpty else { return }; snapshot(); annotations = []; selectedID = nil }

    // MARK: Gesture pipeline (points are in image space)

    func beginDrag(at p: CGPoint, displayScale: CGFloat) {
        didSnapshot = false
        let handle = 10 / max(displayScale, 0.01) // handle hit radius in image px
        switch tool {
        case .select:
            if let id = selectedID, let a = annotations.first(where: { $0.id == id }),
               let corner = cornerHit(a, p, radius: handle) {
                mode = .resize(corner); original = a; dragStart = p
            } else if let hit = hitTest(p) {
                selectedID = hit.id; mode = .move; original = hit; dragStart = p
            } else {
                selectedID = nil; mode = .pan; panStart = panOffset
            }
        case .eraser:
            mode = .erase; eraseHit(p)
        case .text:
            mode = .none // handled on tap
        case .pencil, .highlighter:
            draft = Annotation(tool: tool, points: [AnnotationPoint(x: p.x, y: p.y)],
                               colorHex: colorHex, lineWidth: lineWidth)
            mode = .draw
        case .circle, .rectangle, .arrow, .xMarker:
            dragStart = p
            draft = Annotation(tool: tool, x: p.x, y: p.y, width: 0, height: 0,
                               colorHex: colorHex, lineWidth: lineWidth)
            mode = .draw
        }
    }

    func updateDrag(to p: CGPoint, translation: CGSize, displayScale: CGFloat) {
        switch mode {
        case .draw:
            guard var d = draft else { return }
            if d.tool.isFreehand {
                d.points.append(AnnotationPoint(x: p.x, y: p.y))
            } else if d.tool == .arrow {
                d.width = p.x - dragStart.x; d.height = p.y - dragStart.y
            } else {
                d.x = min(dragStart.x, p.x); d.y = min(dragStart.y, p.y)
                d.width = abs(p.x - dragStart.x); d.height = abs(p.y - dragStart.y)
            }
            draft = d
        case .move:
            guard let o = original, let idx = annotations.firstIndex(where: { $0.id == o.id }) else { return }
            ensureSnapshot()
            let dx = p.x - dragStart.x, dy = p.y - dragStart.y
            annotations[idx] = translated(o, dx: dx, dy: dy)
        case .resize(let corner):
            guard let o = original, let idx = annotations.firstIndex(where: { $0.id == o.id }) else { return }
            ensureSnapshot()
            annotations[idx] = resized(o, corner: corner, to: p)
        case .pan:
            panOffset = CGSize(width: panStart.width + translation.width,
                               height: panStart.height + translation.height)
        case .erase:
            eraseHit(p)
        case .none:
            break
        }
    }

    func endDrag() {
        if case .draw = mode, var d = draft {
            // discard zero-size accidental taps
            let tiny = !d.tool.isFreehand && abs(d.width) < 3 && abs(d.height) < 3
            let emptyPath = d.tool.isFreehand && d.points.count < 2
            if !tiny && !emptyPath {
                ensureSnapshot()
                annotations.append(d)
                selectedID = d.id
            }
            draft = nil
        }
        mode = .none
        original = nil
    }

    /// Tap handling for text placement / select / erase single click.
    func tap(at p: CGPoint) {
        switch tool {
        case .text:
            snapshot()
            let a = Annotation(tool: .text, x: p.x, y: p.y, colorHex: colorHex, lineWidth: lineWidth, text: "Label")
            annotations.append(a)
            selectedID = a.id
            textEntry = TextEntry(annotationID: a.id, text: a.text ?? "")
        case .eraser:
            eraseHit(p)
        case .select:
            selectedID = hitTest(p)?.id
        default:
            break
        }
    }

    func commitText(_ entry: TextEntry) {
        guard let idx = annotations.firstIndex(where: { $0.id == entry.annotationID }) else { return }
        if entry.text.trimmingCharacters(in: .whitespaces).isEmpty {
            annotations.remove(at: idx)
        } else {
            annotations[idx].text = entry.text
        }
    }

    func deleteSelected() {
        guard let id = selectedID, let idx = annotations.firstIndex(where: { $0.id == id }) else { return }
        snapshot(); annotations.remove(at: idx); selectedID = nil
    }

    // MARK: Zoom

    func setZoom(_ value: CGFloat) { zoom = min(max(value, 0.25), 6) }
    func zoomIn() { setZoom(zoom * 1.2) }
    func zoomOut() { setZoom(zoom / 1.2) }
    func resetView() { zoom = 1; panOffset = .zero }

    // MARK: Flatten

    func flattened() -> NSImage {
        AnnotationRenderer.render(base: baseImage, pixelSize: pixelSize, annotations: annotations)
    }

    // MARK: Geometry helpers

    private func translated(_ a: Annotation, dx: Double, dy: Double) -> Annotation {
        var c = a
        if a.tool.isFreehand {
            c.points = a.points.map { AnnotationPoint(x: $0.x + dx, y: $0.y + dy) }
        } else {
            c.x = a.x + dx; c.y = a.y + dy
        }
        return c
    }

    private func resized(_ a: Annotation, corner: Corner, to p: CGPoint) -> Annotation {
        var c = a
        if a.tool == .arrow {
            c.width = p.x - a.x; c.height = p.y - a.y; return c
        }
        var minX = a.x, minY = a.y, maxX = a.x + a.width, maxY = a.y + a.height
        switch corner {
        case .tl: minX = p.x; minY = p.y
        case .tr: maxX = p.x; minY = p.y
        case .bl: minX = p.x; maxY = p.y
        case .br: maxX = p.x; maxY = p.y
        }
        c.x = min(minX, maxX); c.y = min(minY, maxY)
        c.width = abs(maxX - minX); c.height = abs(maxY - minY)
        return c
    }

    nonisolated func boundingRect(_ a: Annotation) -> CGRect {
        if a.tool.isFreehand {
            let xs = a.points.map(\.x), ys = a.points.map(\.y)
            guard let minX = xs.min(), let maxX = xs.max(), let minY = ys.min(), let maxY = ys.max() else { return .zero }
            return CGRect(x: minX, y: minY, width: maxX - minX, height: maxY - minY)
        }
        return CGRect(x: a.x, y: a.y, width: a.width, height: a.height).standardized
    }

    private func hitTest(_ p: CGPoint) -> Annotation? {
        for a in annotations.reversed() {
            let r = boundingRect(a).insetBy(dx: -8, dy: -8)
            if r.contains(p) { return a }
        }
        return nil
    }

    private func cornerHit(_ a: Annotation, _ p: CGPoint, radius: CGFloat) -> Corner? {
        let r = boundingRect(a)
        let corners: [(Corner, CGPoint)] = [
            (.tl, CGPoint(x: r.minX, y: r.minY)), (.tr, CGPoint(x: r.maxX, y: r.minY)),
            (.bl, CGPoint(x: r.minX, y: r.maxY)), (.br, CGPoint(x: r.maxX, y: r.maxY))
        ]
        for (corner, pt) in corners where hypot(pt.x - p.x, pt.y - p.y) <= radius { return corner }
        return nil
    }

    private func eraseHit(_ p: CGPoint) {
        if let hit = hitTest(p), let idx = annotations.firstIndex(where: { $0.id == hit.id }) {
            ensureSnapshot()
            annotations.remove(at: idx)
        }
    }
}

extension AnnotationViewModel.TextEntry: Equatable {}
