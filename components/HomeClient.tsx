"use client"

import { useState } from "react"
import UploadZone from "@/components/UploadZone"
import NoteInput from "@/components/NoteInput"
import ReportPreview from "@/components/ReportPreview"
import VoicePlayer from "@/components/VoicePlayer"
import HistoryPanel from "@/components/HistoryPanel"
import ChatPanel from "@/components/ChatPanel"
import PreferencesPanel from "@/components/PreferencesPanel"

interface Report {
  summary: string
  sections: { title: string; content: string }[]
  dataHighlights: string[]
  nextSteps: string[]
  imageAnalysis?: string
}

export default function HomeClient() {
  const [images, setImages] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [period, setPeriod] = useState("weekly")
  const [tags, setTags] = useState("")
  const [chatOpen, setChatOpen] = useState(false)
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState(false)

  const handleGenerate = async () => {
    if (!notes.trim() && images.length === 0) {
      setError("Add notes or screenshots first")
      return
    }
    setError("")
    setLoading(true)
    setReport(null)
    setEditing(false)

    try {
      const form = new FormData()
      form.set("notes", notes)
      form.set("period", period)
      form.set("tags", tags)
      for (const img of images) {
        const byteChars = atob(img)
        const byteArr = new Uint8Array(byteChars.length)
        for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i)
        form.append("images", new Blob([byteArr], { type: "image/png" }), `img_${Date.now()}.png`)
      }

      const res = await fetch("/api/generate", { method: "POST", body: form })
      if (!res.ok) throw new Error("Generation failed")
      setReport(await res.json())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectMemory = (mem: any) => {
    setNotes(mem.summary)
  }

  const handleExportPDF = () => {
    window.print()
  }

  const reportText = report
    ? [report.summary, ...report.sections.map((s) => `${s.title}\n${s.content}`), "Next Steps:", ...report.nextSteps].join("\n\n")
    : ""

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 relative">
      <PreferencesPanel />
      <HistoryPanel onSelectMemory={handleSelectMemory} />
      <div className="fixed bottom-4 right-4 z-50 space-y-3">
        {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="w-12 h-12 bg-blue-600 hover:bg-blue-500 rounded-full shadow-lg flex items-center justify-center transition ml-auto"
          title="Ask about reports"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
          </svg>
        </button>
      </div>

      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="text-blue-400">Report</span>Agent
        </h1>
        <p className="text-gray-500 text-sm mt-2">Screenshots + notes → AI-powered structured reports with memory</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <UploadZone images={images} onImagesChange={setImages} />
          <NoteInput
            notes={notes}
            onNotesChange={setNotes}
            period={period}
            onPeriodChange={setPeriod}
            tags={tags}
            onTagsChange={setTags}
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl font-medium transition text-sm"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating with memory...
              </span>
            ) : "Generate Report"}
          </button>
          {error && (
            <div className="flex items-center justify-between bg-red-900/30 border border-red-800/50 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
              <button onClick={() => setError("")} className="text-red-400 hover:text-red-300 text-lg leading-none">&times;</button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {report && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                {editing ? "Editing..." : "Generated Report"}
              </p>
              <div className="flex gap-2">
                <VoicePlayer text={reportText} />
                <button
                  onClick={() => setEditing(!editing)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition"
                >
                  {editing ? "Save" : "Edit"}
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([reportText], { type: "text/markdown" })
                    const a = document.createElement("a")
                    a.href = URL.createObjectURL(blob)
                    a.download = `report-${period}-${Date.now()}.md`
                    a.click()
                  }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition"
                >
                  .md
                </button>
                <button
                  onClick={handleExportPDF}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition"
                >
                  PDF
                </button>
              </div>
            </div>
          )}
          <ReportPreview
            report={report}
            loading={loading}
            editing={editing}
            onReportChange={setReport}
          />
        </div>
      </div>

      <p className="text-center text-xs text-gray-700 pt-8 print:hidden">
        Powered by Qwen Cloud AI (DashScope) · Track 1: MemoryAgent · Qwen Cloud Global AI Hackathon
      </p>
    </div>
  )
}
