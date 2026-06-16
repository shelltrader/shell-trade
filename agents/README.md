# Agent Architecture — Shell Trade

Nine AI agents form the content-generation operating system. They form a pipeline, not a flat list — each agent's output is another agent's input. See `automation/architecture.md` for the full end-to-end system (Game Event → Content Database → Content Director → Platform Agents → Voice Generation → Video Creation → Publishing) and `content-events/schema.md` for the structured events that feed this pipeline at the top.

## The nine agents

| # | Agent | Role in the pipeline |
|---|-------|----------------------|
| 1 | [Content Director](content-director.md) | Triage layer. Reads every incoming game event, decides what's worth turning into content, assigns it to a pillar and a set of platforms. |
| 2 | [Trading Educator](trading-educator.md) | Accuracy layer. Validates and enriches the educational substance behind any content before it ships — makes sure the lesson is actually correct. |
| 3 | [Script Writer](script-writer.md) | Creative layer. Turns a Content-Director-approved, Trading-Educator-validated brief into an actual script/caption/copy draft, in brand voice. |
| 4 | [X Agent](x-agent.md) | Platform execution. Adapts scripts into X-native posts/threads and publishes. |
| 5 | [TikTok Agent](tiktok-agent.md) | Platform execution. Adapts scripts into TikTok-native short video and publishes. |
| 6 | [YouTube Agent](youtube-agent.md) | Platform execution. Adapts scripts into YouTube long-form/Shorts and publishes. |
| 7 | [Instagram Agent](instagram-agent.md) | Platform execution. Adapts scripts into Reels/carousels/Stories and publishes. |
| 8 | [Community Agent](community-agent.md) | Feedback loop. Monitors replies/comments/DMs across platforms, responds in brand voice, surfaces signal back to Content Director and Analytics. |
| 9 | [Analytics Agent](analytics-agent.md) | Measurement layer. Tracks performance of published content against KPIs in `marketing/social-strategy.md`, reports back to Content Director to close the loop. |

## Flow

```
Game Event (content-events/schema.md)
        │
        ▼
Content Director  ──assigns pillar + platforms──▶  Trading Educator (validates accuracy)
        │                                                    │
        └────────────────────◀── approved brief ────────────┘
        ▼
Script Writer (drafts copy/script in brand voice)
        │
        ▼
Platform Agents (X / TikTok / YouTube / Instagram) ──▶ Voice Generation ──▶ Video Creation ──▶ Publishing
        │
        ▼
Community Agent (monitors response)  ──▶  Analytics Agent (measures performance)
        │                                          │
        └──────────────── feeds back ──────────────┘
                           ▼
                  Content Director (next cycle)
```

Each agent's prompt template is designed to be runnable standalone (e.g., inside an n8n node calling Claude or ChatGPT) — see `automation/architecture.md` for the recommended orchestration tooling.
