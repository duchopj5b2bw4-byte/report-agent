import { NextRequest, NextResponse } from "next/server"
import { getPreferences, updatePreferences } from "@/lib/memory"

export async function GET() {
  return NextResponse.json(await getPreferences())
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const focusAreas = Array.isArray(body.focusAreas)
      ? body.focusAreas.map((item: unknown) => String(item).trim()).filter(Boolean).slice(0, 12)
      : []
    const retentionDays = Math.min(3650, Math.max(1, Number(body.retentionDays) || 365))
    const preferences = await updatePreferences({
      style: String(body.style || "concise").slice(0, 40),
      tone: String(body.tone || "professional").slice(0, 40),
      focusAreas,
      retentionDays,
    })
    return NextResponse.json(preferences)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
