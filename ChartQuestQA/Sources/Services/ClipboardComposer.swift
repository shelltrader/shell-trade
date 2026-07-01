import Foundation
import AppKit
import CoreText

/// Builds a single image = the annotated screenshot on top + a text panel
/// (notes, voice-note transcript, AI analysis) below it. Because it's ONE image,
/// a single paste into a chat carries everything — and Claude reads the text
/// straight from the picture.
public enum ClipboardComposer {

    public static func compose(review r: Review, fileStore: FileStore) -> NSImage? {
        let shotRel = r.annotatedPath ?? r.originalPath
        guard let shot = fileStore.image(at: shotRel),
              let shotCG = shot.cgImage(forProposedRect: nil, context: nil, hints: nil) else { return nil }

        let targetWidth: CGFloat = 1100
        let pad: CGFloat = 30
        let shotW = CGFloat(shotCG.width), shotH = CGFloat(shotCG.height)
        let scale = min(1, targetWidth / max(shotW, 1))
        let drawShotW = shotW * scale
        let drawShotH = shotH * scale

        let text = attributedText(r)
        let textWidth = targetWidth - pad * 2
        let framesetter = CTFramesetterCreateWithAttributedString(text)
        let suggested = CTFramesetterSuggestFrameSizeWithConstraints(
            framesetter, CFRange(location: 0, length: 0), nil,
            CGSize(width: textWidth, height: .greatestFiniteMagnitude), nil)
        let textH = ceil(suggested.height) + 24

        let totalW = targetWidth
        let totalH = pad + drawShotH + pad + textH + pad

        let colorSpace = CGColorSpaceCreateDeviceRGB()
        guard let ctx = CGContext(data: nil, width: Int(totalW), height: Int(totalH),
                                  bitsPerComponent: 8, bytesPerRow: 0, space: colorSpace,
                                  bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return nil }

        // Background.
        ctx.setFillColor(NSColor(hex: "#0B0E14").cgColor)
        ctx.fill(CGRect(x: 0, y: 0, width: totalW, height: totalH))

        // Screenshot near the top (y-up: top = high y), centered.
        let shotRect = CGRect(x: (totalW - drawShotW) / 2, y: totalH - pad - drawShotH,
                              width: drawShotW, height: drawShotH)
        ctx.draw(shotCG, in: shotRect)

        // A divider line.
        ctx.setStrokeColor(NSColor(hex: "#1A2030").cgColor)
        ctx.setLineWidth(1)
        let dividerY = pad + textH + 12
        ctx.move(to: CGPoint(x: pad, y: dividerY)); ctx.addLine(to: CGPoint(x: totalW - pad, y: dividerY)); ctx.strokePath()

        // Text panel below.
        let textRect = CGRect(x: pad, y: pad, width: textWidth, height: textH)
        let frame = CTFramesetterCreateFrame(framesetter, CFRange(location: 0, length: 0),
                                             CGPath(rect: textRect, transform: nil), nil)
        CTFrameDraw(frame, ctx)

        guard let cgOut = ctx.makeImage() else { return nil }
        return NSImage(cgImage: cgOut, size: CGSize(width: totalW, height: totalH))
    }

    /// Composites an ARBITRARY image with a header + caption panel below it — the same
    /// "everything in one readable PNG" treatment as `compose`, but for a single
    /// screenshot + its note. Used by the batch exporter so each shot in a batch
    /// becomes one self-contained image you can drag straight into Claude.
    public static func composeCaptioned(image shot: NSImage, header: String, caption: String,
                                        targetWidth: CGFloat = 1100) -> NSImage? {
        guard let shotCG = shot.cgImage(forProposedRect: nil, context: nil, hints: nil) else { return nil }
        let pad: CGFloat = 30
        let shotW = CGFloat(shotCG.width), shotH = CGFloat(shotCG.height)
        let scale = min(1, targetWidth / max(shotW, 1))
        let drawShotW = shotW * scale, drawShotH = shotH * scale

        let text = captionedText(header: header, caption: caption)
        let textWidth = targetWidth - pad * 2
        let framesetter = CTFramesetterCreateWithAttributedString(text)
        let suggested = CTFramesetterSuggestFrameSizeWithConstraints(
            framesetter, CFRange(location: 0, length: 0), nil,
            CGSize(width: textWidth, height: .greatestFiniteMagnitude), nil)
        let textH = ceil(suggested.height) + 24

        let totalW = targetWidth
        let totalH = pad + drawShotH + pad + textH + pad

        let colorSpace = CGColorSpaceCreateDeviceRGB()
        guard let ctx = CGContext(data: nil, width: Int(totalW), height: Int(totalH),
                                  bitsPerComponent: 8, bytesPerRow: 0, space: colorSpace,
                                  bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return nil }

        ctx.setFillColor(NSColor(hex: "#0B0E14").cgColor)
        ctx.fill(CGRect(x: 0, y: 0, width: totalW, height: totalH))

        let shotRect = CGRect(x: (totalW - drawShotW) / 2, y: totalH - pad - drawShotH,
                              width: drawShotW, height: drawShotH)
        ctx.draw(shotCG, in: shotRect)

        ctx.setStrokeColor(NSColor(hex: "#1A2030").cgColor)
        ctx.setLineWidth(1)
        let dividerY = pad + textH + 12
        ctx.move(to: CGPoint(x: pad, y: dividerY)); ctx.addLine(to: CGPoint(x: totalW - pad, y: dividerY)); ctx.strokePath()

        let textRect = CGRect(x: pad, y: pad, width: textWidth, height: textH)
        let frame = CTFramesetterCreateFrame(framesetter, CFRange(location: 0, length: 0),
                                             CGPath(rect: textRect, transform: nil), nil)
        CTFrameDraw(frame, ctx)

        guard let cgOut = ctx.makeImage() else { return nil }
        return NSImage(cgImage: cgOut, size: CGSize(width: totalW, height: totalH))
    }

    private static func captionedText(header: String, caption: String) -> NSAttributedString {
        let m = NSMutableAttributedString()
        let para = NSMutableParagraphStyle(); para.lineSpacing = 2; para.paragraphSpacing = 8
        func add(_ s: String, size: CGFloat, weight: NSFont.Weight, color: NSColor) {
            m.append(NSAttributedString(string: s, attributes: [
                .font: NSFont.systemFont(ofSize: size, weight: weight),
                .foregroundColor: color, .paragraphStyle: para]))
        }
        add(header + "\n", size: 19, weight: .bold, color: .white)
        if caption.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            add("(no note)\n", size: 14, weight: .regular, color: NSColor(hex: "#64789D"))
        } else {
            add(caption + "\n", size: 15, weight: .regular, color: NSColor(hex: "#EAF1FF"))
        }
        return m
    }

    /// Plain-text fallback (used if the image can't be built).
    public static func promptText(_ r: Review) -> String {
        var s = "Fix this ChartQuest issue, from QA review \(r.id).\n"
        s += "Category: \(r.category.title) · Priority: \(r.priority.title)"
        if let sev = r.severity { s += " · Severity: \(sev.title)" }
        s += "\n"
        if !r.transcript.isEmpty { s += "Voice note: \(r.transcript)\n" }
        if !r.userNotes.isEmpty { s += "Notes: \(r.userNotes)\n" }
        if let a = r.analysis {
            if !a.summary.isEmpty { s += "\nAI summary: \(a.summary)\n" }
            for (i, issue) in a.issues.enumerated() {
                s += "\nIssue \(i + 1): \(issue.title) [\(issue.severity.title)]\n"
                if !issue.description.isEmpty { s += "  Problem: \(issue.description)\n" }
                if !issue.recommendedFix.isEmpty { s += "  Fix: \(issue.recommendedFix)\n" }
                if !issue.devNotes.isEmpty { s += "  Dev notes: \(issue.devNotes)\n" }
            }
        }
        if !r.developerNotes.isEmpty { s += "\nMy notes: \(r.developerNotes)\n" }
        return s
    }

    private static func attributedText(_ r: Review) -> NSAttributedString {
        let m = NSMutableAttributedString()
        let white = NSColor.white
        let soft = NSColor(hex: "#AEBFD6")
        let accent = NSColor(hex: "#16F29A")

        let para = NSMutableParagraphStyle()
        para.lineSpacing = 2
        para.paragraphSpacing = 8

        func add(_ string: String, size: CGFloat, weight: NSFont.Weight, color: NSColor) {
            m.append(NSAttributedString(string: string, attributes: [
                .font: NSFont.systemFont(ofSize: size, weight: weight),
                .foregroundColor: color,
                .paragraphStyle: para
            ]))
        }

        add("\(r.id) — \(r.title.isEmpty ? r.category.title + " review" : r.title)\n", size: 21, weight: .bold, color: white)
        var meta = "Category: \(r.category.title)    Priority: \(r.priority.title)"
        if let sev = r.severity { meta += "    Severity: \(sev.title)" }
        add(meta + "\n\n", size: 13, weight: .medium, color: soft)

        if !r.transcript.isEmpty {
            add("Voice note  ", size: 14, weight: .bold, color: accent)
            add("\(r.transcript)\n\n", size: 14, weight: .regular, color: white)
        }
        if !r.userNotes.isEmpty {
            add("Notes  ", size: 14, weight: .bold, color: accent)
            add("\(r.userNotes)\n\n", size: 14, weight: .regular, color: white)
        }
        if let a = r.analysis {
            if !a.summary.isEmpty {
                add("AI summary  ", size: 14, weight: .bold, color: accent)
                add("\(a.summary)\n\n", size: 13.5, weight: .regular, color: soft)
            }
            for (i, issue) in a.issues.enumerated() {
                add("Issue \(i + 1): \(issue.title)  [\(issue.severity.title)]\n", size: 15, weight: .bold, color: white)
                if !issue.description.isEmpty { add("Problem: \(issue.description)\n", size: 13, weight: .regular, color: soft) }
                if !issue.recommendedFix.isEmpty { add("Fix: \(issue.recommendedFix)\n", size: 13, weight: .regular, color: soft) }
                if !issue.devNotes.isEmpty { add("Dev notes: \(issue.devNotes)\n", size: 13, weight: .regular, color: soft) }
                add("\n", size: 8, weight: .regular, color: soft)
            }
        }
        if !r.developerNotes.isEmpty {
            add("My notes  ", size: 14, weight: .bold, color: accent)
            add("\(r.developerNotes)\n", size: 13.5, weight: .regular, color: soft)
        }
        return m
    }
}
