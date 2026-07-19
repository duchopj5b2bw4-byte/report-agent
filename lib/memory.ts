import fs from "fs"
import path from "path"
import { getEmbedding } from "./qwen"
import { getCloudflareContext } from "@opennextjs/cloudflare"

export interface MemoryEntry {
  id: string
  timestamp: string
  period: string
  summary: string
  sections: { title: string; content: string }[]
  dataHighlights: string[]
  nextSteps: string[]
  notes: string
  embedding?: number[]
  tags: string[]
  lastAccessedAt?: string
  accessCount?: number
}

interface MemoryStore {
  entries: MemoryEntry[]
  preferences: {
    style?: string
    tone?: string
    focusAreas?: string[]
    retentionDays?: number
  }
}

const DB_PATH = path.join(process.cwd(), "data", "memories.json")
const DEFAULT_RETENTION_DAYS = 365
const MAX_MEMORY_ENTRIES = 100

function pruneStore(store: MemoryStore): MemoryStore {
  const retentionDays = Math.max(1, store.preferences.retentionDays || DEFAULT_RETENTION_DAYS)
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000
  const active = store.entries
    .filter((entry) => {
      const timestamp = new Date(entry.timestamp).getTime()
      return !Number.isFinite(timestamp) || timestamp >= cutoff
    })
    .sort((a, b) => {
      const aTime = new Date(a.lastAccessedAt || a.timestamp).getTime()
      const bTime = new Date(b.lastAccessedAt || b.timestamp).getTime()
      const accessDelta = (b.accessCount || 0) - (a.accessCount || 0)
      return accessDelta || bTime - aTime
    })
    .slice(0, MAX_MEMORY_ENTRIES)

  return { ...store, entries: active.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) }
}

interface ReportKV {
  get<T>(key: string, type: "json"): Promise<T | null>
  put(key: string, value: string): Promise<void>
}

async function getKV(): Promise<ReportKV | null> {
  try {
    const { env } = await getCloudflareContext({ async: true })
    return (env as CloudflareEnv).REPORT_MEMORIES || null
  } catch {
    return null
  }
}

async function loadStore(): Promise<MemoryStore> {
  const kv = await getKV()
  if (kv) return pruneStore((await kv.get<MemoryStore>("store", "json")) || { entries: [], preferences: {} })
  try {
    if (!fs.existsSync(DB_PATH)) return { entries: [], preferences: {} }
    return pruneStore(JSON.parse(fs.readFileSync(DB_PATH, "utf-8")))
  } catch {
    return { entries: [], preferences: {} }
  }
}

async function saveStore(store: MemoryStore) {
  store = pruneStore(store)
  const kv = await getKV()
  if (kv) {
    await kv.put("store", JSON.stringify(store))
    return
  }
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2))
}

export async function saveMemory(entry: Omit<MemoryEntry, "id" | "timestamp" | "embedding">) {
  const store = await loadStore()
  const memory: MemoryEntry = {
    ...entry,
    id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
    accessCount: 0,
  }

  try {
    const text = [memory.summary, ...memory.dataHighlights, ...memory.sections.map(s => s.content)].join(" ")
    memory.embedding = await getEmbedding(text)
  } catch {
    // embedding non-critical
  }

  store.entries.push(memory)
  await saveStore(store)
  return memory
}

export async function getRecentMemories(n = 5): Promise<MemoryEntry[]> {
  const store = await loadStore()
  return store.entries.slice(-n).reverse()
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0)
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0))
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0))
  return magA && magB ? dot / (magA * magB) : 0
}

export async function findRelevantMemories(query: string, topK = 3): Promise<MemoryEntry[]> {
  const store = await loadStore()
  const entriesWithEmbedding = store.entries.filter(e => e.embedding)
  if (entriesWithEmbedding.length === 0) return []

  const queryEmbedding = await getEmbedding(query)
  if (!queryEmbedding.length) return []

  const scored = entriesWithEmbedding
    .map(e => ({ entry: e, score: cosineSimilarity(queryEmbedding, e.embedding!) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)

  const now = new Date().toISOString()
  for (const { entry } of scored) {
    entry.lastAccessedAt = now
    entry.accessCount = (entry.accessCount || 0) + 1
  }
  if (scored.length) await saveStore(store)
  return scored.map(s => s.entry)
}

export async function getPreferences() {
  return (await loadStore()).preferences
}

export async function updatePreferences(updates: Partial<MemoryStore["preferences"]>) {
  const store = await loadStore()
  store.preferences = { ...store.preferences, ...updates }
  await saveStore(store)
  return store.preferences
}

export async function getAllMemories(): Promise<MemoryEntry[]> {
  return (await loadStore()).entries
}

export async function deleteMemory(id: string) {
  const store = await loadStore()
  store.entries = store.entries.filter(e => e.id !== id)
  await saveStore(store)
}
