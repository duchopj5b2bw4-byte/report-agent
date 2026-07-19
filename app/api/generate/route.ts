import { NextRequest, NextResponse } from "next/server"
import { analyzeImages, generateReport } from "@/lib/qwen"
import { saveMemory } from "@/lib/memory"

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const notes = (form.get("notes") as string) || ""
    const period = (form.get("period") as string) || "weekly"
    const tagsRaw = (form.get("tags") as string) || ""
    const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : []
    const files = form.getAll("images") as File[]

    const images: string[] = []
    for (const file of files) {
      const buf = Buffer.from(await file.arrayBuffer())
      images.push(buf.toString("base64"))
    }

    const [imageAnalysis] = await Promise.all([
      images.length > 0 ? analyzeImages(images) : Promise.resolve(""),
    ])

    const report = await generateReport({ notes, images, period, tags }, imageAnalysis)

    // Persist to memory
    await saveMemory({
      period,
      summary: report.summary,
      sections: report.sections,
      dataHighlights: report.dataHighlights,
      nextSteps: report.nextSteps,
      notes,
      tags,
    })

    return NextResponse.json({ ...report, imageAnalysis: imageAnalysis.slice(0, 500) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}