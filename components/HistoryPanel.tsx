"use client"

import { useState, useEffect } from "react"

interface Memory {
  id: string
  timestamp: string
  period: string
  summary: string
  dataHighlights: string[]
  tags: string[]
}

interface HistoryPanelProps {
  onSelectMemory: (mem: Memory) => void
}

export default function HistoryPanel({ onSelectMemory }: HistoryPanelProps) {
  const [memories, setMemories] = useState<Memory[]>([])
  const [open, setOpen] = useState(false)
  const [filterPeriod, setFilterPeriod] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  useEffect(() => {
    fetch("/api/memories")
      .then(r => r.json())
      .then(data => setMemories(data))
      .catch(() => {})
  }, [])

  const filtered = memories.filter((m) => {
    if (filterPeriod && m.period !== filterPeriod) return false
    if (dateFrom && new Date(m.timestamp) < new Date(dateFrom)) return false
    if (dateTo && new Date(m.timestamp) > new Date(dateTo + "T23:59:59")) return false
    return true
  })

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition"
      >
        {open ? "Close History" : `History (${memories.length})`}
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-96 bg-[#111] border-l border-gray-800 p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">Report History</h2>

            <div className="space-y-2 mb-4">
              <div className="flex gap-2">
                {["", "daily", "weekly", "monthly"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilterPeriod(p)}
                    className={`px-3 py-1 rounded-lg text-xs transition ${
                      filterPeriod === p ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    {p || "All"}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 text-xs">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1 text-gray-300 w-full"
                />
                <span className="text-gray-500 self-center">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1 text-gray-300 w-full"
                />
              </div>
            </div>

            {filtered.length === 0 && (
              <p className="text-gray-500 text-sm">No reports match the filter.</p>
            )}
            <div className="space-y-3">
              {filtered.map((m) => (
                <div
                  key={m.id}
                  onClick={() => { onSelectMemory(m); setOpen(false) }}
                  className="bg-gray-900 rounded-xl p-4 cursor-pointer hover:bg-gray-800 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">
                      {new Date(m.timestamp).toLocaleDateString()} · {m.period}
                    </span>
                    {m.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {m.tags.slice(0, 3).map((t) => (
                          <span key={t} className="px-2 py-0.5 bg-blue-900/30 text-blue-300 text-xs rounded-full">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2">{m.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}