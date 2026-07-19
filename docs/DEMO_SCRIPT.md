# ReportAgent demo script (4:30 target)

## 0:00–0:25 — Problem and promise

“Weekly reporting loses context. ReportAgent is a persistent multimodal MemoryAgent powered by Qwen Cloud. It turns screenshots and notes into reports that remember preferences, compare trends, and selectively forget outdated experience.”

## 0:25–0:55 — Persistent preferences

Open **Memory Settings**. Set style to **Executive**, tone to **Analytical**, focus areas to `growth, product quality`, and retention to **365 days**. Save.

Explain: “These preferences are persisted and injected into future report context. The retention control implements timely forgetting, while storage remains bounded.”

## 0:55–1:50 — Multimodal report generation

Upload `demo-assets/week3-dashboard.png` and enter:

> Week 3 dashboard review. Extract the metrics from the screenshot and compare them with prior reports. Team sharing beta is now available.

Choose **Weekly**, add tags `growth, product, vision`, and generate.

Point out screenshot-derived WAU, onboarding completion, the structured summary, highlights, sections, and next steps.

## 1:50–2:35 — Cross-session trend memory

Open **History** and show persisted reports. Explain that each report is embedded with `text-embedding-v3`.

Generate a follow-up report or use the existing Week 3 result. Highlight comparisons to Week 1 and Week 2 and explain the retrieval policy: recent memories plus semantic Top-K, deduplicated and limited to five reports.

## 2:35–3:10 — Memory-grounded chat

Open **Memory Chat** and ask:

> How did weekly active users and onboarding change from Week 1 to Week 3?

Show that the answer is grounded in stored reports rather than the current page state.

## 3:10–3:45 — Human control and delivery

Demonstrate **Edit**, then download **Markdown**, mention browser **PDF** export, and play **Qwen Voice**.

Explain: “The agent automates analysis while keeping the report editable and exportable.”

## 3:45–4:30 — Architecture and close

Show the architecture slide and summarize:

1. Qwen3.7-Plus understands notes and screenshots.
2. text-embedding-v3 retrieves critical memories.
3. Preferences persist across sessions.
4. Recency, access frequency, and expiration keep memory bounded.
5. qwen3-tts-flash narrates the result.

Close with: “ReportAgent does not just write the next report. It learns how the user works, recalls what matters, and forgets what no longer does.”
