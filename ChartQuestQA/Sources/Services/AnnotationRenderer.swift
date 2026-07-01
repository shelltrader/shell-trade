import Foundation
import AppKit
import CoreText

/// Flattens structured annotations onto a base screenshot to produce the
/// "annotated" PNG. Done with a raw Core Graphics bitmap context (origin
/// bottom-left, y-up) so orientation is fully under our control — no reliance
/// on NSImage/`lockFocusFlipped` flip behaviour, which is inconsistent.
///
/// Annotation coordinates are stored in the screenshot's PIXEL space with a
/// TOP-LEFT origin (matching the editor canvas). We convert each y with
/// `fy(y) = H - y` so everything lands upright over the upright base image.
public enum AnnotationRenderer {

    public static func render(base: NSImage, pixelSize: CGSize, annotations: [Annotation]) -> NSImage {
        let width = max(Int(pixelSize.width), 1)
        let height = max(Int(pixelSize.height), 1)
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        guard let ctx = CGContext(data: nil, width: width, height: height,
                                  bitsPerComponent: 8, bytesPerRow: 0, space: colorSpace,
                                  bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
            return base
        }

        // Draw the base screenshot upright (CGContextDrawImage is upright in a y-up context).
        if let cgImage = base.cgImage(forProposedRect: nil, context: nil, hints: nil) {
            ctx.draw(cgImage, in: CGRect(x: 0, y: 0, width: CGFloat(width), height: CGFloat(height)))
        }

        let H = CGFloat(height)
        for annotation in annotations { draw(annotation, in: ctx, height: H) }

        guard let output = ctx.makeImage() else { return base }
        return NSImage(cgImage: output, size: pixelSize)
    }

    private static func draw(_ a: Annotation, in ctx: CGContext, height H: CGFloat) {
        let color = NSColor(hex: a.colorHex)
        let lineWidth = CGFloat(a.lineWidth)
        ctx.setLineWidth(lineWidth)
        ctx.setLineCap(.round)
        ctx.setLineJoin(.round)
        ctx.setStrokeColor(color.cgColor)
        ctx.setFillColor(color.cgColor)

        // Top-left rect → y-up rect.
        let rect = CGRect(x: a.x, y: H - a.y - a.height, width: a.width, height: a.height).standardized

        switch a.tool {
        case .circle:
            ctx.strokeEllipse(in: rect)

        case .rectangle:
            let path = CGPath(roundedRect: rect, cornerWidth: 4, cornerHeight: 4, transform: nil)
            ctx.addPath(path); ctx.strokePath()

        case .xMarker:
            ctx.move(to: CGPoint(x: rect.minX, y: rect.minY)); ctx.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
            ctx.move(to: CGPoint(x: rect.maxX, y: rect.minY)); ctx.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
            ctx.strokePath()

        case .arrow:
            let start = CGPoint(x: a.x, y: H - a.y)
            let end = CGPoint(x: a.x + a.width, y: H - (a.y + a.height))
            ctx.move(to: start); ctx.addLine(to: end); ctx.strokePath()
            let angle = atan2(end.y - start.y, end.x - start.x)
            let headLength = max(lineWidth * 4, 14)
            let spread = CGFloat.pi / 7
            ctx.move(to: end)
            ctx.addLine(to: CGPoint(x: end.x - headLength * cos(angle - spread), y: end.y - headLength * sin(angle - spread)))
            ctx.addLine(to: CGPoint(x: end.x - headLength * cos(angle + spread), y: end.y - headLength * sin(angle + spread)))
            ctx.closePath(); ctx.fillPath()

        case .pencil:
            strokePath(a.points, in: ctx, height: H)

        case .highlighter:
            ctx.setStrokeColor(color.withAlphaComponent(0.32).cgColor)
            ctx.setLineWidth(max(lineWidth * 3, 14))
            ctx.setLineCap(.square)
            strokePath(a.points, in: ctx, height: H)

        case .text:
            let fontSize = max(lineWidth * 5, 22)
            let attrs: [NSAttributedString.Key: Any] = [
                .font: NSFont.systemFont(ofSize: fontSize, weight: .semibold),
                .foregroundColor: color
            ]
            let line = CTLineCreateWithAttributedString(NSAttributedString(string: a.text ?? "", attributes: attrs))
            ctx.saveGState()
            ctx.textMatrix = .identity
            ctx.textPosition = CGPoint(x: a.x, y: H - a.y - fontSize)
            CTLineDraw(line, ctx)
            ctx.restoreGState()

        case .select, .eraser:
            break
        }
    }

    private static func strokePath(_ points: [AnnotationPoint], in ctx: CGContext, height H: CGFloat) {
        guard let first = points.first, points.count > 1 else { return }
        ctx.move(to: CGPoint(x: first.x, y: H - first.y))
        for p in points.dropFirst() { ctx.addLine(to: CGPoint(x: p.x, y: H - p.y)) }
        ctx.strokePath()
    }
}
