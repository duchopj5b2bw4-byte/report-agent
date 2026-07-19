interface CloudflareEnv {
  REPORT_MEMORIES: {
    get<T>(key: string, type: "json"): Promise<T | null>
    put(key: string, value: string): Promise<void>
  }
  ASSETS: unknown
  DASHSCOPE_API_KEY: string
  OPENAI_BASE_URL?: string
  OPENAI_MODEL?: string
}
