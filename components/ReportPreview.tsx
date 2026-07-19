"use client"

import { useRef, useState } from "react"

interface Report {
  summary: string
  sections: { title: string; content: string }[]
  dataHighlights: string[]
  nextSteps: string[]
  imageAnalysis?: string
}

interface ReportPreviewProps {
  report: Report | null
  loading: boolean
  editing?: boolean
  onReportChange?: (report: Report) => void
}

export default function ReportPreview({ report, loading, editing, onReportChange }: ReportPreviewProps) {
  const textRef = useRef<HTMLDivElement>(null)

  if (loading) {
    return (
      <div className="bg-[#111] border border-gray-800 rounded-xl p-6 space-y-4 animate-pulse">
        <div className="h-4 bg-gray-800 rounded w-1/3" />
        <div className="h-3 bg-gray-800 rounded w-full" />
        <div className="h-3 bg-gray-800 rounded w-5/6" />
        <div className="h-20 bg-gray-800 rounded w-full" />
        <div className="h-3 bg-gray-800 rounded w-2/3" />
      </div>
    )
  }

  if (!report) return null

  const update = (patch: Partial<Report>) => {
    if (onReportChange) onReportChange({ ...report, ...patch })
  }

  const updateHighlight = (i: number, val: string) => {
    const h = [...report.dataHighlights]
    h[i] = val
    update({ dataHighlights: h })
  }

  const removeHighlight = (i: number) => {
    update({ dataHighlights: report.dataHighlights.filter((_, j) => j !== i) })
  }

  const addHighlight = () => {
    update({ dataHighlights: [...report.dataHighlights, ""] })
  }

  const updateSection = (i: number, field: "title" | "content", val: string) => {
    const s = [...report.sections]
    s[i] = { ...s[i], [field]: val }
    update({ sections: s })
  }

  const updateNextStep = (i: number, val: string) => {
    const n = [...report.nextSteps]
    n[i] = val
    update({ nextSteps: n })
  }

  const removeNextStep = (i: number) => {
    update({ nextSteps: report.nextSteps.filter((_, j) => j !== i) })
  }

  const addNextStep = () => {
    update({ nextSteps: [...report.nextSteps, ""] })
  }

  return (
    <div className="bg-[#111] border border-gray-800 rounded-xl p-6 space-y-6 print:bg-white print:text-black print:border-none" ref={textRef}>
      {/* Summary */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 print:text-gray-600">Executive Summary</p>
        {editing ? (
          <textarea
            value={report.summary}
            onChange={(e) => update({ summary: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 resize-none print:bg-white print:text-black print:border-gray-300"
            rows={3}
          />
        ) : (
          <p className="text-gray-200 text-sm leading-relaxed print:text-black">{report.summary}</p>
        )}
      </div>

      {/* Data Highlights */}
      {report.dataHighlights.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider print:text-gray-600">Key Highlights</p>
            {editing && (
              <button onClick={addHighlight} className="text-xs text-blue-400 hover:text-blue-300">+ Add</button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {report.dataHighlights.map((h, i) =>
              editing ? (
                <div key={i} className="flex items-center gap-1">
                  <input
                    value={h}
                    onChange={(e) => updateHighlight(i, e.target.value)}
                    className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-1 text-sm text-gray-200 focus:outline-none focus:border-blue-500 w-40 print:bg-white print:text-black print:border-gray-300"
                  />
                  <button onClick={() => removeHighlight(i)} className="text-red-400 hover:text-red-300 text-xs">&times;</button>
                </div>
              ) : (
                <span key={i} className="px-3 py-1 bg-blue-900/30 text-blue-300 text-xs rounded-full border border-blue-800/50 print:bg-blue-100 print:text-blue-800 print:border-blue-300">
                  {h}
                </span>
              )
            )}
          </div>
        </div>
      )}

      {/* Sections */}
      {report.sections.map((s, i) => (
        <div key={i}>
          {editing ? (
            <div className="space-y-2">
              <input
                value={s.title}
                onChange={(e) => updateSection(i, "title", e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 uppercase tracking-wider focus:outline-none focus:border-blue-500 print:bg-white print:text-black print:border-gray-300"
              />
              <textarea
                value={s.content}
                onChange={(e) => updateSection(i, "content", e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 text-sm text-gray-300 focus:outline-none focus:border-blue-500 resize-none print:bg-white print:text-black print:border-gray-300"
                rows={4}
              />
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 print:text-gray-600">{s.title}</p>
              <p className="text-gray-300 text-sm leading-relaxed print:text-black">{s.content}</p>
            </>
          )}
        </div>
      ))}

      {/* Next Steps */}
      {report.nextSteps.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider print:text-gray-600">Next Steps</p>
            {editing && (
              <button onClick={addNextStep} className="text-xs text-blue-400 hover:text-blue-300">+ Add</button>
            )}
          </div>
          <ul className="space-y-1">
            {report.nextSteps.map((ns, i) =>
              editing ? (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-blue-400 mt-0.5">→</span>
                  <input
                    value={ns}
                    onChange={(e) => updateNextStep(i, e.target.value)}
                    className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-1 text-sm text-gray-300 focus:outline-none focus:border-blue-500 print:bg-white print:text-black print:border-gray-300"
                  />
                  <button onClick={() => removeNextStep(i)} className="text-red-400 hover:text-red-300 text-xs">&times;</button>
                </li>
              ) : (
                <li key={i} className="text-sm text-gray-300 flex items-start gap-2 print:text-black">
                  <span className="text-blue-400 mt-0.5">→</span>
                  {ns}
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {report.imageAnalysis && (
        <details className="text-xs text-gray-600 print:hidden">
          <summary className="cursor-pointer hover:text-gray-400">Screenshot analysis raw</summary>
          <p className="mt-2 text-gray-500">{report.imageAnalysis}</p>
        </details>
      )}
    </div>
  )
}