import SwiftUI

struct CanvasLayout {
    let origin: CGPoint
    let scale: CGFloat
    func toView(_ p: CGPoint) -> CGPoint { CGPoint(x: origin.x + p.x * scale, y: origin.y + p.y * scale) }
    func toView(_ x: Double, _ y: Double) -> CGPoint { toView(CGPoint(x: x, y: y)) }
    func toImage(_ p: CGPoint) -> CGPoint { CGPoint(x: (p.x - origin.x) / scale, y: (p.y - origin.y) / scale) }
}

func computeLayout(canvas: CGSize, pixel: CGSize, zoom: CGFloat, pan: CGSize) -> CanvasLayout {
    let fit = min(canvas.width / max(pixel.width, 1), canvas.height / max(pixel.height, 1))
    let scale = max(fit * zoom, 0.01)
    let w = pixel.width * scale, h = pixel.height * scale
    let origin = CGPoint(x: (canvas.width - w) / 2 + pan.width,
                         y: (canvas.height - h) / 2 + pan.height)
    return CanvasLayout(origin: origin, scale: scale)
}

struct AnnotationCanvasView: View {
    @ObservedObject var vm: AnnotationViewModel

    @State private var dragStarted = false
    @State private var moved = false
    @State private var lastZoom: CGFloat = 1

    var body: some View {
        GeometryReader { geo in
            let layout = computeLayout(canvas: geo.size, pixel: vm.pixelSize, zoom: vm.zoom, pan: vm.panOffset)
            Canvas { context, _ in
                let imgRect = CGRect(origin: layout.origin,
                                     size: CGSize(width: vm.pixelSize.width * layout.scale,
                                                  height: vm.pixelSize.height * layout.scale))
                context.draw(context.resolve(Image(nsImage: vm.baseImage)), in: imgRect)
                for a in vm.renderList { drawAnnotation(a, &context, layout) }
                if let id = vm.selectedID, let a = vm.annotations.first(where: { $0.id == id }) {
                    drawSelection(a, &context, layout, vm: vm)
                }
            }
            .background(Color.black.opacity(0.001)) // make whole area hittable
            .gesture(
                DragGesture(minimumDistance: 0, coordinateSpace: .local)
                    .onChanged { value in
                        if !dragStarted {
                            dragStarted = true; moved = false
                            vm.beginDrag(at: layout.toImage(value.startLocation), displayScale: layout.scale)
                        }
                        if abs(value.translation.width) + abs(value.translation.height) > 3 { moved = true }
                        vm.updateDrag(to: layout.toImage(value.location),
                                      translation: value.translation, displayScale: layout.scale)
                    }
                    .onEnded { value in
                        vm.endDrag()
                        if !moved && vm.tool == .text { vm.tap(at: layout.toImage(value.location)) }
                        dragStarted = false; moved = false
                    }
            )
            .simultaneousGesture(
                MagnificationGesture()
                    .onChanged { vm.setZoom(lastZoom * $0) }
                    .onEnded { _ in lastZoom = vm.zoom }
            )
            .onAppear { lastZoom = vm.zoom }
            .clipped()
        }
    }
}

// MARK: - Drawing helpers (GraphicsContext render methods are non-mutating)

private func drawAnnotation(_ a: Annotation, _ context: inout GraphicsContext, _ layout: CanvasLayout) {
    let color = Color(hex: a.colorHex)
    let w = max(a.lineWidth * layout.scale, 0.5)

    switch a.tool {
    case .circle:
        let r = viewRect(a, layout)
        context.stroke(Path(ellipseIn: r), with: .color(color), lineWidth: w)
    case .rectangle:
        let r = viewRect(a, layout)
        context.stroke(Path(roundedRect: r, cornerRadius: 4 * layout.scale), with: .color(color), lineWidth: w)
    case .xMarker:
        let r = viewRect(a, layout)
        var p = Path()
        p.move(to: CGPoint(x: r.minX, y: r.minY)); p.addLine(to: CGPoint(x: r.maxX, y: r.maxY))
        p.move(to: CGPoint(x: r.maxX, y: r.minY)); p.addLine(to: CGPoint(x: r.minX, y: r.maxY))
        context.stroke(p, with: .color(color), style: StrokeStyle(lineWidth: w, lineCap: .round))
    case .arrow:
        let start = layout.toView(a.x, a.y)
        let end = layout.toView(a.x + a.width, a.y + a.height)
        drawArrow(from: start, to: end, width: w, color: color, context: &context)
    case .pencil:
        context.stroke(freehandPath(a, layout), with: .color(color),
                       style: StrokeStyle(lineWidth: w, lineCap: .round, lineJoin: .round))
    case .highlighter:
        context.stroke(freehandPath(a, layout), with: .color(color.opacity(0.32)),
                       style: StrokeStyle(lineWidth: max(w * 3, 12), lineCap: .square, lineJoin: .round))
    case .text:
        let size = max(a.lineWidth * 5, 22) * layout.scale
        let resolved = context.resolve(Text(a.text ?? "").font(.system(size: size, weight: .semibold)).foregroundColor(color))
        context.draw(resolved, at: layout.toView(a.x, a.y), anchor: .topLeading)
    case .select, .eraser:
        break
    }
}

private func drawSelection(_ a: Annotation, _ context: inout GraphicsContext, _ layout: CanvasLayout, vm: AnnotationViewModel) {
    let r = viewRect(boundingRect: vm.boundingRect(a), layout).insetBy(dx: -4, dy: -4)
    context.stroke(Path(roundedRect: r, cornerRadius: 3), with: .color(Theme.accent2),
                   style: StrokeStyle(lineWidth: 1.5, dash: [5, 4]))
    for c in [CGPoint(x: r.minX, y: r.minY), CGPoint(x: r.maxX, y: r.minY),
              CGPoint(x: r.minX, y: r.maxY), CGPoint(x: r.maxX, y: r.maxY)] {
        let handle = CGRect(x: c.x - 4, y: c.y - 4, width: 8, height: 8)
        context.fill(Path(roundedRect: handle, cornerRadius: 2), with: .color(Theme.accent2))
    }
}

private func viewRect(_ a: Annotation, _ layout: CanvasLayout) -> CGRect {
    let tl = layout.toView(a.x, a.y)
    return CGRect(x: tl.x, y: tl.y, width: a.width * layout.scale, height: a.height * layout.scale).standardized
}
private func viewRect(boundingRect r: CGRect, _ layout: CanvasLayout) -> CGRect {
    let tl = layout.toView(r.origin)
    return CGRect(x: tl.x, y: tl.y, width: r.width * layout.scale, height: r.height * layout.scale)
}
private func freehandPath(_ a: Annotation, _ layout: CanvasLayout) -> Path {
    var p = Path()
    guard let first = a.points.first else { return p }
    p.move(to: layout.toView(CGPoint(x: first.x, y: first.y)))
    for pt in a.points.dropFirst() { p.addLine(to: layout.toView(CGPoint(x: pt.x, y: pt.y))) }
    return p
}
private func drawArrow(from start: CGPoint, to end: CGPoint, width: CGFloat, color: Color, context: inout GraphicsContext) {
    var shaft = Path(); shaft.move(to: start); shaft.addLine(to: end)
    context.stroke(shaft, with: .color(color), style: StrokeStyle(lineWidth: width, lineCap: .round))
    let angle = atan2(end.y - start.y, end.x - start.x)
    let head = max(width * 4, 12)
    let spread = CGFloat.pi / 7
    var tri = Path()
    tri.move(to: end)
    tri.addLine(to: CGPoint(x: end.x - head * cos(angle - spread), y: end.y - head * sin(angle - spread)))
    tri.addLine(to: CGPoint(x: end.x - head * cos(angle + spread), y: end.y - head * sin(angle + spread)))
    tri.closeSubpath()
    context.fill(tri, with: .color(color))
}
