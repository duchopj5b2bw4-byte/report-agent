# ReportAgent — Devpost submission copy

## Inspiration

Teams create weekly reports repeatedly, yet every reporting session starts from zero. Important decisions, preferences, and trends disappear across documents. ReportAgent turns reporting into a learning loop: every report becomes experience that improves the next one.

## What it does

ReportAgent accepts screenshots and notes, uses Qwen Cloud to extract visible metrics, and creates an editable structured report. Its persistent MemoryAgent embeds every result, retrieves only the most relevant and recent experiences, recalls the user's style/tone/focus preferences, compares trends across periods, and automatically forgets memories outside a configurable retention window. Users can search history, ask questions across reports, export Markdown/PDF, and listen with Qwen TTS.

## How we built it

- Next.js App Router and React for the full-stack application.
- Qwen3.7-Plus for text and vision reasoning.
- text-embedding-v3 plus cosine similarity for semantic retrieval.
- qwen3-tts-flash for report narration.
- A bounded memory store combining recency, access frequency, semantic relevance, and configurable expiration.
- Cloudflare Workers KV for the live edge demo and an Alibaba Cloud Function Compute custom-container deployment specification for the competition backend.

## Challenges

The main challenge was making memory useful without flooding the model context. ReportAgent merges recent and semantic memories, deduplicates them, limits context to five reports, and tracks access frequency. Another challenge was keeping the same persistence interface across local JSON development and serverless KV production.

## Accomplishments

- Genuine cross-session trend comparison validated across three weekly reports.
- Multimodal extraction of dashboard metrics from screenshots.
- Persistent user preferences and configurable memory forgetting.
- Memory-grounded chat, editable reports, PDF/Markdown export, and voice playback.
- 40 automated tests covering components, routes, Qwen integration, and memory behavior.

## What we learned

Memory quality depends more on selection than volume. Combining recency with semantic similarity produced more consistent comparisons than simply sending all historical reports. Explicit preference memory also made the learning behavior easy to understand and demonstrate.

## What's next

We plan to add organization-level memory isolation, hybrid vector/database retrieval, automatic outcome tracking for recommended actions, and richer evaluation of whether the agent's decisions improve over time.

## Built with

Qwen Cloud, Alibaba Cloud Function Compute, DashScope, Qwen3.7-Plus, text-embedding-v3, qwen3-tts-flash, Next.js, React, TypeScript, Workers KV, Vitest, Docker

## Links to use in Devpost

- Repository: https://github.com/duchopj5b2bw4-byte/report-agent
- Qwen Cloud proof: `lib/qwen.ts`
- Alibaba Cloud deployment proof: `deploy/alibaba-cloud/s.yaml`
- Architecture diagram: `public/architecture.svg`
- Live demo: add the final verified URL
- Demo video: add after recording
