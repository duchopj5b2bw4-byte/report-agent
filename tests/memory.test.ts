import { describe, it, expect, vi, beforeEach } from "vitest"

const mockExistsSync = vi.fn()
const mockReadFileSync = vi.fn()
const mockWriteFileSync = vi.fn()
const mockMkdirSync = vi.fn()

vi.mock("fs", () => ({
  default: {
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
    mkdirSync: mockMkdirSync,
  },
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
  mkdirSync: mockMkdirSync,
}))

vi.mock("path", () => ({
  default: {
    join: (...args: string[]) => args.join("/"),
    dirname: (p: string) => p.split("/").slice(0, -1).join("/"),
  },
  join: (...args: string[]) => args.join("/"),
  dirname: (p: string) => p.split("/").slice(0, -1).join("/"),
}))

vi.mock("@/lib/qwen", () => ({
  getEmbedding: vi.fn(),
}))

const mockGetEmbedding = (await import("@/lib/qwen")).getEmbedding as ReturnType<typeof vi.fn>

const {
  saveMemory, getRecentMemories, getPreferences, updatePreferences, getAllMemories, deleteMemory,
} = await import("@/lib/memory")

describe("memory module", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExistsSync.mockReturnValue(false)
  })

  const sampleEntry = {
    period: "weekly",
    summary: "Good progress",
    sections: [{ title: "Dev", content: "Shipped features" }],
    dataHighlights: ["Revenue up"],
    nextSteps: ["Deploy"],
    notes: "Worked hard",
    tags: ["frontend"],
  }

  it("saveMemory creates entry with id and timestamp", async () => {
    mockGetEmbedding.mockResolvedValue([0.1, 0.2])
    const result = await saveMemory(sampleEntry)
    expect(result.id).toMatch(/^mem_/)
    expect(result.timestamp).toBeTruthy()
    expect(result.summary).toBe("Good progress")
  })

  it("saveMemory calls getEmbedding with combined text", async () => {
    mockGetEmbedding.mockResolvedValue([0.1, 0.2])
    await saveMemory(sampleEntry)
    expect(mockGetEmbedding).toHaveBeenCalledWith(expect.stringContaining("Good progress"))
  })

  it("getRecentMemories returns empty array when no data", async () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(JSON.stringify({ entries: [], preferences: {} }))
    const result = await getRecentMemories()
    expect(result).toEqual([])
  })

  it("getRecentMemories returns entries in reverse order", async () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(JSON.stringify({
      entries: [
        { id: "1", summary: "First", sections: [], dataHighlights: [], nextSteps: [], notes: "", tags: [], period: "weekly", timestamp: "2026-01-01T00:00:00.000Z" },
        { id: "2", summary: "Second", sections: [], dataHighlights: [], nextSteps: [], notes: "", tags: [], period: "weekly", timestamp: "2026-01-02T00:00:00.000Z" },
      ],
      preferences: {},
    }))
    const recent = await getRecentMemories(2)
    expect(recent).toHaveLength(2)
    expect(recent[0].summary).toBe("Second")
  })

  it("getAllMemories returns all entries", async () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(JSON.stringify({
      entries: [{ id: "1", summary: "Test", sections: [], dataHighlights: [], nextSteps: [], notes: "", tags: [], period: "weekly", timestamp: new Date().toISOString() }],
      preferences: {},
    }))
    const all = await getAllMemories()
    expect(all).toHaveLength(1)
  })

  it("deleteMemory removes entry by id", async () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(JSON.stringify({
      entries: [{ id: "mem_1", summary: "A", sections: [], dataHighlights: [], nextSteps: [], notes: "", tags: [], period: "weekly", timestamp: "" }, { id: "mem_2", summary: "B", sections: [], dataHighlights: [], nextSteps: [], notes: "", tags: [], period: "weekly", timestamp: "" }],
      preferences: {},
    }))
    await deleteMemory("mem_1")
    const writeCall = mockWriteFileSync.mock.calls[0][1] as string
    const parsed = JSON.parse(writeCall)
    expect(parsed.entries).toHaveLength(1)
    expect(parsed.entries[0].id).toBe("mem_2")
  })

  it("updatePreferences merges prefs", async () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(JSON.stringify({
      entries: [],
      preferences: { tone: "formal" },
    }))
    await updatePreferences({ style: "technical" })
    const write = mockWriteFileSync.mock.calls[0][1] as string
    const parsed = JSON.parse(write)
    expect(parsed.preferences.tone).toBe("formal")
    expect(parsed.preferences.style).toBe("technical")
  })

  it("forgets memories outside the configured retention window", async () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(JSON.stringify({
      entries: [
        { id: "old", summary: "Expired", sections: [], dataHighlights: [], nextSteps: [], notes: "", tags: [], period: "weekly", timestamp: "2020-01-01T00:00:00.000Z" },
        { id: "new", summary: "Current", sections: [], dataHighlights: [], nextSteps: [], notes: "", tags: [], period: "weekly", timestamp: new Date().toISOString() },
      ],
      preferences: { retentionDays: 30 },
    }))
    const memories = await getAllMemories()
    expect(memories.map((entry) => entry.id)).toEqual(["new"])
  })
})
