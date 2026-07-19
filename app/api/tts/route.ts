import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
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
    if (!res.ok) return NextResponse.json({ error: "TTS failed" }, { status: 500 })
    const json = await res.json()
    const audioUrl = json.output?.audio?.url
    if (!audioUrl) return NextResponse.json({ error: "No audio URL" }, { status: 500 })
    const audioRes = await fetch(audioUrl)
    if (!audioRes.ok) return NextResponse.json({ error: "Audio download failed" }, { status: 500 })
    const audio = await audioRes.arrayBuffer()
    return new NextResponse(audio, {
      headers: { "Content-Type": "audio/wav", "Content-Length": audio.byteLength.toString() },
    })
  } catch {
    return NextResponse.json({ error: "TTS error" }, { status: 500 })
  }
}
