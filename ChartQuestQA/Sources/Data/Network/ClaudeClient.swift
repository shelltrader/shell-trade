import Foundation

/// Catalog of selectable Claude models (friendly name + API id).
public struct ClaudeModelOption: Identifiable, Hashable, Sendable {
    public let id: String      // API model id
    public let name: String    // display name
    public let blurb: String

    public static let all: [ClaudeModelOption] = [
        .init(id: "claude-opus-4-8", name: "Claude Opus 4.8", blurb: "Best analysis — deepest reasoning"),
        .init(id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", blurb: "Fast + strong — great for heavy playtesting"),
        .init(id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", blurb: "Fastest + cheapest — quick triage")
    ]
    public static let defaultModel = "claude-opus-4-8"

    public static func name(for id: String) -> String {
        all.first { $0.id == id }?.name ?? id
    }
}

/// Thin transport over the Anthropic Messages API. Knows nothing about
/// ChartQuest — it just sends content blocks and returns the text response.
public struct ClaudeClient: Sendable {
    public enum ContentPart: Sendable {
        case text(String)
        case imagePNG(Data)
    }

    private let endpoint = URL(string: "https://api.anthropic.com/v1/messages")!
    private let version = "2023-06-01"

    public init() {}

    /// Several current models reject the `temperature` parameter. Omit it for them.
    private func modelAcceptsTemperature(_ model: String) -> Bool {
        let deprecated = ["opus-4-8", "sonnet-4-6", "haiku-4-5"]
        return !deprecated.contains { model.contains($0) }
    }

    public func send(system: String,
                     parts: [ContentPart],
                     model: String,
                     maxTokens: Int,
                     temperature: Double,
                     apiKey: String) async throws -> String {
        guard !apiKey.isEmpty else { throw AIError.missingKey }

        var content: [[String: Any]] = []
        for part in parts {
            switch part {
            case .text(let t):
                content.append(["type": "text", "text": t])
            case .imagePNG(let data):
                content.append([
                    "type": "image",
                    "source": ["type": "base64", "media_type": "image/png",
                               "data": data.base64EncodedString()]
                ])
            }
        }

        var body: [String: Any] = [
            "model": model,
            "max_tokens": maxTokens,
            "system": system,
            "messages": [["role": "user", "content": content]]
        ]
        // Newer models (e.g. Opus 4.8) deprecate `temperature`; only send it to
        // models that still accept it.
        if temperature >= 0, modelAcceptsTemperature(model) {
            body["temperature"] = temperature
        }

        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.timeoutInterval = 120
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        request.setValue(version, forHTTPHeaderField: "anthropic-version")
        request.setValue("application/json", forHTTPHeaderField: "content-type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            throw AIError.transport(error.localizedDescription)
        }

        guard let http = response as? HTTPURLResponse else { throw AIError.empty }
        guard (200..<300).contains(http.statusCode) else {
            let bodyText = String(data: data, encoding: .utf8) ?? "no body"
            throw AIError.http(http.statusCode, bodyText)
        }

        // Response: { "content": [ { "type": "text", "text": "..." }, ... ] }
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let blocks = json["content"] as? [[String: Any]] else {
            throw AIError.empty
        }
        let text = blocks.compactMap { block -> String? in
            (block["type"] as? String) == "text" ? block["text"] as? String : nil
        }.joined(separator: "\n")

        guard !text.isEmpty else { throw AIError.empty }
        return text
    }
}
