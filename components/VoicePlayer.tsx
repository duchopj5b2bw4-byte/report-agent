"use client"

import { useState } from "react"

interface VoicePlayerProps {
  text: string
}

export default function VoicePlayer({ text }: VoicePlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handlePlay = async () => {
    if (audioUrl) {
      setPlaying(!playing)
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 1000) }),
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      setPlaying(true)
    } finally {
      setLoading(false)
    }
  }

  if (!text) return null

  return (
    <button
      onClick={handlePlay}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition disabled:opacity-50"
    >
      {loading ? "Generating..." : playing ? "Playing..." : "Play Summary"}
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
    </button>
  )
}
