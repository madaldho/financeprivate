type CacheData = {
  data: any
  timestamp: number
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const cache = new Map<string, CacheData>()

export function setCache(key: string, data: any) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  })
}

export function getCache(key: string) {
  const cached = cache.get(key)
  if (!cached) return null

  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    cache.delete(key)
    return null
  }

  return cached.data
}

export function clearCache() {
  cache.clear()
}

