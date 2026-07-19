import { describe, it, expect, vi, beforeEach } from "vitest"

const mockCreate = vi.fn()
const mockEmbeddings = vi.fn()

vi.mock("openai", () => {
  function MockOpenAI() {
    this.chat = { completions: { create: mockCreate } }
    this.embeddings = { create: mockEmbeddings }
  }
  return { default: MockOpenAI }
})

vi.mock("@/lib/memory", () => ({
  getRecentMemories: vi.fn(() => []),
  findRelevantMemories: vi.fn(() => Promise.resolve([])),
  getPreferences: vi.fn(() => ({})),
}))

const mockFetch = vi.fn()
globalThis.fetch = mockFetch as any

const { analyzeImages, generateReport, textToSpeech, getEmbedding } = await import("@/lib/qwen")

describe("analyzeImages", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("returns empty string for no images", async () => {
    expect(await analyzeImages([])).toBe("")
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("calls OpenAI with image content and returns description", async () => {
    mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: "The chart shows revenue growth" } }] })
    const result = await analyzeImages(["base64img1"])
    expect(mockCreate).toHaveBeenCalledOnce()
    expect(result).toBe("The chart shows revenue growth")
  })
})

describe("generateReport", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("parses clean JSON response from OpenAI", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({
        summary: "Good week",
        sections: [{ title: "Dev", content: "Fixed bugs" }],
        dataHighlights: ["Shipped 5 features"],
        nextSteps: ["Deploy to prod"],
      }) } }],
    })
    const result = await generateReport({ notes: "fixed bugs this week", images: [], period: "weekly" }, "")
    expect(result.summary).toBe("Good week")
    expect(result.sections).toHaveLength(1)
    expect(result.dataHighlights).toContain("Shipped 5 features")
    expect(result.nextSteps).toContain("Deploy to prod")
  })

  it("strips markdown code fences before parsing JSON", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "```json\n{\"summary\": \"Nested in code block\"}\n```" } }],
    })
    const result = await generateReport({ notes: "test", images: [], period: "daily" }, "")
    expect(result.summary).toBe("Nested in code block")
  })

  it("falls back to raw text when JSON is invalid", async () => {
    mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: "Just some text without JSON" } }] })
    const result = await generateReport({ notes: "test", images: [], period: "daily" }, "")
    expect(result.summary).toBe("Just some text without JSON")
    expect(result.sections).toHaveLength(1)
    expect(result.sections[0].title).toBe("Raw Output")
  })
})

describe("textToSpeech", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("returns ArrayBuffer on success", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ output: { audio: { url: "https://audio.url/test.wav" } } }) })
      .mockResolvedValueOnce({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)) })
    const result = await textToSpeech("Hello world")
    expect(result).toBeInstanceOf(ArrayBuffer)
  })

  it("returns null on API failure", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })
    expect(await textToSpeech("Hello")).toBeNull()
  })

  it("returns null on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"))
    expect(await textToSpeech("Hello")).toBeNull()
  })
})

describe("getEmbedding", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("returns embedding vector from API", async () => {
    mockEmbeddings.mockResolvedValueOnce({ data: [{ embedding: [0.1, 0.2, 0.3] }] })
    expect(await getEmbedding("test text")).toEqual([0.1, 0.2, 0.3])
  })

  it("returns empty array when API fails", async () => {
    mockEmbeddings.mockRejectedValueOnce(new Error("API error"))
    expect(await getEmbedding("test")).toEqual([])
  })
})