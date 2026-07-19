import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock the qwen lib
vi.mock("@/lib/qwen", () => ({
  analyzeImages: vi.fn(),
  generateReport: vi.fn(),
}))

const mockAnalyze = (await import("@/lib/qwen")).analyzeImages as ReturnType<typeof vi.fn>
const mockGenerate = (await import("@/lib/qwen")).generateReport as ReturnType<typeof vi.fn>

const { POST: generatePost } = await import("@/app/api/generate/route")

function createMockRequest(formData: Record<string, any>) {
  const fd = new FormData()
  for (const [key, val] of Object.entries(formData)) {
    if (Array.isArray(val)) {
      for (const item of val) fd.append(key, item)
    } else {
      fd.set(key, val as string)
    }
  }
  return { formData: () => Promise.resolve(fd) } as any
}

describe("POST /api/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns report JSON on success with notes only", async () => {
    mockAnalyze.mockResolvedValue("")
    mockGenerate.mockResolvedValue({
      summary: "Good progress",
      sections: [{ title: "Done", content: "Finished tasks" }],
      dataHighlights: ["Task A complete"],
      nextSteps: ["Start task B"],
      raw: "{...}",
    })

    const req = createMockRequest({ notes: "Worked on project", period: "weekly" })
    const res = await generatePost(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.summary).toBe("Good progress")
    expect(json.sections).toHaveLength(1)
    expect(json.dataHighlights).toContain("Task A complete")
    expect(json.nextSteps).toContain("Start task B")
  })

  it("calls analyzeImages when images are provided", async () => {
    mockAnalyze.mockResolvedValue("Chart shows growth")
    mockGenerate.mockResolvedValue({
      summary: "Great week", sections: [], dataHighlights: [], nextSteps: [], raw: "{}",
    })

    const fakeFile = new File(["fake"], "test.png", { type: "image/png" })
    const fd = new FormData()
    fd.set("notes", "test")
    fd.set("period", "weekly")
    fd.append("images", fakeFile)
    const req = { formData: () => Promise.resolve(fd) } as any

    await generatePost(req)

    expect(mockAnalyze).toHaveBeenCalledOnce()
  })

  it("returns 500 on generation failure", async () => {
    mockAnalyze.mockRejectedValue(new Error("API error"))

    const fakeFile = new File(["fake"], "test.png", { type: "image/png" })
    const fd = new FormData()
    fd.set("notes", "test")
    fd.set("period", "weekly")
    fd.append("images", fakeFile)
    const req = { formData: () => Promise.resolve(fd) } as any
    const res = await generatePost(req)
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.error).toBe("API error")
  })
})

const { POST: ttsPost } = await import("@/app/api/tts/route")

describe("POST /api/tts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.fetch = vi.fn()
  })

  it("returns audio on success", async () => {
    const mockFetch = globalThis.fetch as ReturnType<typeof vi.fn>
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ output: { audio: { url: "https://audio.url/test.wav" } } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(20)),
      })

    const req = { json: () => Promise.resolve({ text: "Hello world" }) } as any
    const res = await ttsPost(req)
    const buf = await res.arrayBuffer()

    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toBe("audio/wav")
    expect(buf.byteLength).toBe(20)
  })

  it("returns 500 on TTS API failure", async () => {
    const mockFetch = globalThis.fetch as ReturnType<typeof vi.fn>
    mockFetch.mockResolvedValueOnce({ ok: false })

    const req = { json: () => Promise.resolve({ text: "Hello" }) } as any
    const res = await ttsPost(req)

    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe("TTS failed")
  })
})