import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { getRecentMemories, findRelevantMemories } from "@/lib/memory"

const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY || "",
  baseURL: process.env.OPENAI_BASE_URL || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
})

const MODEL = process.env.OPENAI_MODEL || "qwen3.7-plus"

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json()
    if (!question) return NextResponse.json({ error: "Question required" }, { status: 400 })

    const recent = await getRecentMemories(5)
    const relevant = await findRelevantMemories(question, 3)

    const deduped = new Map<string, typeof recent[0]>()
    for (const m of [...recent, ...relevant]) deduped.set(m.id, m)
    const memories = [...deduped.values()].slice(0, 5)

    const context = memories.map((m, i) => `[Report ${i + 1}] (${new Date(m.timestamp).toLocaleDateString()} · ${m.period})
Summary: ${m.summary}
Key metrics: ${m.dataHighlights.join("; ") || "none"}
Next steps then: ${m.nextSteps.join("; ") || "none"}
---`).join("\n\n")

    const systemPrompt = `You are a helpful assistant with access to a user's past reports. Answer questions based on the provided historical context. If the answer is not in the context, say so. Be concise and specific.`

    const res = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here are past reports:\n\n${context || "No past reports yet."}\n\nUser question: ${question}` },
      ],
      max_tokens: 1000,
      temperature: 0.2,
    })

    return NextResponse.json({ answer: res.choices[0]?.message?.content || "" })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
