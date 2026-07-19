import { describe, it, expect, vi, beforeEach } from "vitest"

const mockCreate = vi.fn()

vi.mock("openai", () => {
  function MockOpenAI() {
    this.chat = { completions: { create: mockCreate } }
  }
  return { default: MockOpenAI }
})

vi.mock("@/lib/memory", () => ({
  getRecentMemories: vi.fn(),
  findRelevantMemories: vi.fn(),
}))

const mockRecent = (await import("@/lib/memory")).getRecentMemories as ReturnType<typeof vi.fn>
const mockRelevant = (await import("@/lib/memory")).findRelevantMemories as ReturnType<typeof vi.fn>
const { POST } = await import("@/app/api/chat/route")

describe("POST /api/chat", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("returns 400 if no question provided", async () => {
    const req = { json: () => Promise.resolve({}) } as any
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe("Question required")
  })

  it("returns answer from AI with memory context", async () => {
    mockRecent.mockReturnValue([
      { id: "1", timestamp: "2026-07-01", period: "weekly", summary: "Revenue up 20%", dataHighlights: ["20% growth"], nextSteps: [], notes: "", tags: [] },
    ])
    mockRelevant.mockResolvedValue([])
    mockCreate.mockResolvedValue({ choices: [{ message: { content: "Revenue grew 20% in the last week." } }] })
    const req = { json: () => Promise.resolve({ question: "How is revenue trending?" }) } as any
    const res = await POST(req)
    const json = await res.json()
    expect(json.answer).toBe("Revenue grew 20% in the last week.")
  })

  it("handles API errors gracefully", async () => {
    mockRecent.mockReturnValue([])
    mockRelevant.mockResolvedValue([])
    mockCreate.mockRejectedValue(new Error("API failure"))
    const req = { json: () => Promise.resolve({ question: "test" }) } as any
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})