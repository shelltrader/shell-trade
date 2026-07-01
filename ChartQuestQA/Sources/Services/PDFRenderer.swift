import Foundation
import AppKit
import CoreText

/// Renders Markdown to a paginated PDF using Core Text (no print panel, no UI).
public enum PDFRenderer {

    public static func pdfData(fromMarkdown markdown: String) -> Data {
        let attributed = MarkdownStyler.attributed(markdown)
        return paginate(attributed)
    }

    static func paginate(_ attributed: NSAttributedString,
                         pageSize: CGSize = CGSize(width: 612, height: 792),
                         margin: CGFloat = 54) -> Data {
        let pdfData = NSMutableData()
        var mediaBox = CGRect(origin: .zero, size: pageSize)
        guard let consumer = CGDataConsumer(data: pdfData as CFMutableData),
              let context = CGContext(consumer: consumer, mediaBox: &mediaBox, nil) else { return Data() }

        let framesetter = CTFramesetterCreateWithAttributedString(attributed)
        let textRect = CGRect(x: margin, y: margin,
                              width: pageSize.width - margin * 2,
                              height: pageSize.height - margin * 2)
        let path = CGPath(rect: textRect, transform: nil)
        let total = attributed.length
        var cursor = 0

        while cursor < total {
            context.beginPDFPage(nil)
            let frame = CTFramesetterCreateFrame(framesetter, CFRange(location: cursor, length: 0), path, nil)
            CTFrameDraw(frame, context)
            let visible = CTFrameGetVisibleStringRange(frame)
            context.endPDFPage()
            if visible.length <= 0 { break }   // safety: avoid infinite loop
            cursor += visible.length
        }
        context.closePDF()
        return pdfData as Data
    }
}

/// Minimal Markdown → NSAttributedString styler (headings, bullets, inline **bold**).
enum MarkdownStyler {
    static func attributed(_ markdown: String) -> NSAttributedString {
        let body = NSColor.textColor
        let result = NSMutableAttributedString()

        for rawLine in markdown.components(separatedBy: "\n") {
            let line = rawLine
            let para = NSMutableParagraphStyle()
            para.paragraphSpacing = 6
            para.lineSpacing = 2

            if line.hasPrefix("# ") {
                append(result, String(line.dropFirst(2)), font: .boldSystemFont(ofSize: 22), color: body, para: para)
            } else if line.hasPrefix("## ") {
                para.paragraphSpacingBefore = 12
                append(result, String(line.dropFirst(3)), font: .boldSystemFont(ofSize: 16), color: body, para: para)
            } else if line.hasPrefix("### ") {
                append(result, String(line.dropFirst(4)), font: .boldSystemFont(ofSize: 13.5), color: body, para: para)
            } else if line.hasPrefix("- ") || line.hasPrefix("* ") {
                para.firstLineHeadIndent = 12; para.headIndent = 24
                appendInline(result, "•  " + String(line.dropFirst(2)), font: .systemFont(ofSize: 11.5), color: body, para: para)
            } else if line.trimmingCharacters(in: .whitespaces).isEmpty {
                result.append(NSAttributedString(string: "\n"))
            } else {
                appendInline(result, line, font: .systemFont(ofSize: 11.5), color: body, para: para)
            }
        }
        return result
    }

    private static func append(_ target: NSMutableAttributedString, _ text: String,
                               font: NSFont, color: NSColor, para: NSParagraphStyle) {
        target.append(NSAttributedString(string: text + "\n",
            attributes: [.font: font, .foregroundColor: color, .paragraphStyle: para]))
    }

    /// Handles inline **bold** spans.
    private static func appendInline(_ target: NSMutableAttributedString, _ text: String,
                                     font: NSFont, color: NSColor, para: NSParagraphStyle) {
        let bold = NSFont.boldSystemFont(ofSize: font.pointSize)
        let segments = text.components(separatedBy: "**")
        let line = NSMutableAttributedString()
        for (i, seg) in segments.enumerated() {
            let useBold = (i % 2 == 1)
            line.append(NSAttributedString(string: seg,
                attributes: [.font: useBold ? bold : font, .foregroundColor: color, .paragraphStyle: para]))
        }
        line.append(NSAttributedString(string: "\n", attributes: [.font: font, .paragraphStyle: para]))
        target.append(line)
    }
}
