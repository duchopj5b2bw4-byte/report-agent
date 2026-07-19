import { NextResponse } from "next/server"
import { getAllMemories } from "@/lib/memory"

export async function GET() {
  const memories = await getAllMemories()
  const list = memories.map(({ id, timestamp, period, summary, dataHighlights, tags }) => ({
    id, timestamp, period, summary, dataHighlights, tags,
  }))
  return NextResponse.json(list)
}
