"use client"

import { useCallback, useRef } from "react"

interface UploadZoneProps {
  images: string[]
  onImagesChange: (images: string[]) => void
}

export default function UploadZone({ images, onImagesChange }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback((files: FileList) => {
    const newImages: string[] = []
    const promises: Promise<void>[] = []
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith("image/")) {
        promises.push(
          new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = () => {
              const result = reader.result as string
              const base64 = result.split(",")[1]
              if (base64) newImages.push(base64)
              resolve()
            }
            reader.readAsDataURL(files[i])
          })
        )
      }
    }
    Promise.all(promises).then(() => onImagesChange([...images, ...newImages]))
  }, [images, onImagesChange])

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 uppercase tracking-wider">Screenshots</p>
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-gray-500 transition"
      >
        <p className="text-gray-400 text-sm">Drop screenshots here or click to upload</p>
        <p className="text-gray-600 text-xs mt-1">Supports PNG, JPG — charts, dashboards, tables</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((_, i) => (
            <div key={i} className="relative">
              <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center text-xs text-gray-400">
                #{i + 1}
              </div>
              <button
                onClick={() => onImagesChange(images.filter((_, j) => j !== i))}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
