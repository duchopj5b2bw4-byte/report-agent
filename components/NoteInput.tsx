"use client"

interface NoteInputProps {
  notes: string
  onNotesChange: (notes: string) => void
  period: string
  onPeriodChange: (period: string) => void
  tags: string
  onTagsChange: (tags: string) => void
}

const PERIODS = ["daily", "weekly", "monthly"] as const

export default function NoteInput({ notes, onNotesChange, period, onPeriodChange, tags, onTagsChange }: NoteInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 uppercase tracking-wider">Notes</p>
        <span className="text-xs text-gray-600">{notes.length} chars</span>
      </div>

      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => onPeriodChange(p)}
            className={`px-4 py-1.5 rounded-lg text-sm capitalize transition ${
              period === p ? "bg-blue-600 text-white shadow-sm" : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="What did you work on? Achievements, problems solved, metrics — the AI will cross-reference with past reports."
        rows={5}
        className="w-full bg-[#111] border border-gray-800 rounded-xl p-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none transition"
      />

      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Tags</p>
        <input
          value={tags}
          onChange={(e) => onTagsChange(e.target.value)}
          placeholder="frontend, backend, design, qa"
          className="w-full bg-[#111] border border-gray-800 rounded-lg px-4 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition"
        />
      </div>
    </div>
  )
}