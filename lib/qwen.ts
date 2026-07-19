import OpenAI from "openai"
import { getRecentMemories, findRelevantMemories, getPreferences } from "./memory"

const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY || "",
  baseURL: process.env.OPENAI_BASE_URL || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
})

const MODEL = process.env.OPENAI_MODEL || "qwen3.7-plus"

export interface GenerateInput {
  notes: string
  images: string[] // base64
  period: string
  tags?: string[]
}

export interface ReportResult {
  summary: string
  sections: { title: string; content: string }[]
  dataHighlights: string[]
  nextSteps: string[]
  raw: string
}

export async function analyzeImages(images: string[]): Promise<string> {
  if (images.length === 0) return ""

  const content: any[] = [{
    type: "text",
    text: "These are screenshots from my work this period. Describe what each image shows: identify numbers, trends, tables, or any data visible. Be specific.",
  }]
  images.forEach((img, i) => {
    content.push({ type: "image_url", image_url: { url: `data:image/png;base64,${img}` } })
  })

  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content }],
    max_tokens: 1500,
    temperature: 0.2,
  })

  return res.choices[0]?.message?.content || ""
}

async function buildMemoryContext(input: GenerateInput): Promise<string> {
  const recent = await getRecentMemories(3)
  const relevant = await findRelevantMemories(input.notes || "work report")
  const prefs = await getPreferences()

  const parts: string[] = []

  if (prefs.style || prefs.tone || prefs.focusAreas?.length) {
    parts.push("## User Preferences")
    if (prefs.style) parts.push(`Style: ${prefs.style}`)
    if (prefs.tone) parts.push(`Tone: ${prefs.tone}`)
    if (prefs.focusAreas?.length) parts.push(`Focus areas: ${prefs.focusAreas.join(", ")}`)
  }

  const deduped = new Map<string, typeof recent[0]>()
  for (const m of [...recent, ...relevant]) deduped.set(m.id, m)
  const memories = [...deduped.values()].slice(0, 5)

  if (memories.length > 0) {
    parts.push("## Historical Context (Previous Reports)")
    memories.forEach((m, i) => {
      parts.push(`### Past Report ${i + 1} (${new Date(m.timestamp).toLocaleDateString()})`)
      parts.push(`Summary: ${m.summary}`)
      if (m.dataHighlights.length) parts.push(`Key metrics: ${m.dataHighlights.join("; ")}`)
    })
  }

  return parts.join("\n\n")
}

export async function generateReport(input: GenerateInput, imageAnalysis: string): Promise<ReportResult> {
  const memoryContext = await buildMemoryContext(input)

  const prompt = `You are a professional report writer with memory of past reports. Generate a structured ${input.period} report based on the following.

My Notes:
${input.notes || "No notes provided."}

${imageAnalysis ? `Screenshot Analysis:\n${imageAnalysis}` : ""}

${memoryContext ? `\n${memoryContext}\n` : ""}

Instructions:
- Compare this period's progress with past reports if historical context is provided — highlight trends, improvements, or regressions.
- Maintain consistent reporting style with previous reports.
${input.tags?.length ? `- Focus on these areas: ${input.tags.join(", ")}` : ""}

Output valid JSON only (no markdown, no code blocks):
{
  "summary": "2-3 sentence executive summary including trend comparison if historical data exists",
  "sections": [
    { "title": "section name", "content": "detailed analysis with trend context" },
    { "title": "section name", "content": "detailed analysis with trend context" }
  ],
  "dataHighlights": ["key metric or finding with comparison to past", "another finding"],
  "nextSteps": ["action item 1", "action item 2"]
}`

  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2500,
    temperature: 0.3,
  })

  const text = res.choices[0]?.message?.content || ""
  return parseReport(text)
}

function parseReport(text: string): ReportResult {
  try {
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
    const json = JSON.parse(cleaned)
    return {
      summary: json.summary || "",
      sections: json.sections || [],
      dataHighlights: json.dataHighlights || [],
      nextSteps: json.nextSteps || [],
      raw: cleaned,
    }
  } catch {
    return {
      summary: text.slice(0, 200),
      sections: [{ title: "Raw Output", content: text }],
      dataHighlights: [],
      nextSteps: [],
      raw: text,
    }
  }
}

export async function textToSpeech(text: string): Promise<ArrayBuffer | null> {
  try {
    const apiKey = process.env.DASHSCOPE_API_KEY || ""
    const res = await fetch("https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen3-tts-flash",
        input: {
          text: text.slice(0, 500),
          voice: "Cherry",
        },
      }),
    })
    if (!res.ok) return null
    const json = await res.json()
    const audioUrl = json.output?.audio?.url
    if (!audioUrl) return null
    const audioRes = await fetch(audioUrl)
    if (!audioRes.ok) return null
    return audioRes.arrayBuffer()
  } catch {
    return null
  }
}

export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const res = await client.embeddings.create({
      model: "text-embedding-v3",
      input: text,
    })
    return res.data[0]?.embedding || []
  } catch {
    return []
  }
}
