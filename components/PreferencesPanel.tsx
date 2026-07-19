"use client"

import { useEffect, useState } from "react"

export default function PreferencesPanel() {
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState("concise")
  const [tone, setTone] = useState("professional")
  const [focusAreas, setFocusAreas] = useState("")
  const [retentionDays, setRetentionDays] = useState(365)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch("/api/preferences")
      .then((res) => res.json())
      .then((prefs) => {
        if (prefs.style) setStyle(prefs.style)
        if (prefs.tone) setTone(prefs.tone)
        if (prefs.focusAreas) setFocusAreas(prefs.focusAreas.join(", "))
        if (prefs.retentionDays) setRetentionDays(prefs.retentionDays)
      })
      .catch(() => {})
  }, [])

  const save = async () => {
    setSaved(false)
    const response = await fetch("/api/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        style,
        tone,
        focusAreas: focusAreas.split(",").map((item) => item.trim()).filter(Boolean),
        retentionDays,
      }),
    })
    if (response.ok) setSaved(true)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 right-40 z-50 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition"
      >
        Memory Settings
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md bg-[#111] border border-gray-800 rounded-2xl p-6 space-y-4" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Persistent Memory</h2>
                <p className="text-xs text-gray-500">Preferences are recalled in every future report.</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white text-xl">&times;</button>
            </div>
            <label className="block text-xs text-gray-400">Report style
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm">
                <option value="concise">Concise</option><option value="detailed">Detailed</option><option value="executive">Executive</option><option value="technical">Technical</option>
              </select>
            </label>
            <label className="block text-xs text-gray-400">Tone
              <select value={tone} onChange={(e) => setTone(e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm">
                <option value="professional">Professional</option><option value="direct">Direct</option><option value="encouraging">Encouraging</option><option value="analytical">Analytical</option>
              </select>
            </label>
            <label className="block text-xs text-gray-400">Focus areas
              <input value={focusAreas} onChange={(e) => setFocusAreas(e.target.value)} placeholder="growth, quality, delivery" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm" />
            </label>
            <label className="block text-xs text-gray-400">Forget memories older than {retentionDays} days
              <input type="range" min="30" max="730" step="30" value={retentionDays} onChange={(e) => setRetentionDays(Number(e.target.value))} className="mt-2 w-full" />
            </label>
            <button onClick={save} className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm">{saved ? "Saved to memory" : "Save preferences"}</button>
          </div>
        </div>
      )}
    </>
  )
}
