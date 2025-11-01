/**
 * Offline Cache Manager for Convex Queries and API Responses
 */

const CACHE_PREFIX = "myticket_cache_";
const CACHE_VERSION = "v1";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt?: number;
}

/**
 * Get cached data
 */
export async function getCachedData<T>(
  key: string,
  maxAge?: number
): Promise<T | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return null;
  }

  try {
    const cacheKey = `${CACHE_PREFIX}${CACHE_VERSION}_${key}`;
    const cached = localStorage.getItem(cacheKey);

    if (!cached) {
      return null;
    }

    const entry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < now) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    // Check max age
    if (maxAge && now - entry.timestamp > maxAge) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error("[OfflineCache] Error reading cache:", error);
    return null;
  }
}

/**
 * Set cached data
 */
export async function setCachedData<T>(
  key: string,
  data: T,
  ttl?: number
): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const cacheKey = `${CACHE_PREFIX}${CACHE_VERSION}_${key}`;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : undefined,
    };

    localStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch (error) {
    console.error("[OfflineCache] Error writing cache:", error);
    // Handle quota exceeded
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      clearOldCache();
    }
  }
}

/**
 * Clear cached data
 */
export function clearCachedData(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const cacheKey = `${CACHE_PREFIX}${CACHE_VERSION}_${key}`;
  localStorage.removeItem(cacheKey);
}

/**
 * Clear all cached data
 */
export function clearAllCache(): void {
  if (typeof window === "undefined") {
    return;
  }

  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}

/**
 * Clear old cache entries to free up space
 */
function clearOldCache(): void {
  if (typeof window === "undefined") {
    return;
  }

  const keys = Object.keys(localStorage);
  const entries: Array<{ key: string; timestamp: number }> = [];

  keys.forEach((key) => {
    if (key.startsWith(CACHE_PREFIX)) {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const entry: CacheEntry<unknown> = JSON.parse(cached);
          entries.push({ key, timestamp: entry.timestamp });
        }
      } catch {
        // Invalid entry, remove it
        localStorage.removeItem(key);
      }
    }
  });

  // Sort by timestamp (oldest first)
  entries.sort((a, b) => a.timestamp - b.timestamp);

  // Remove oldest 20% of entries
  const toRemove = Math.floor(entries.length * 0.2);
  for (let i = 0; i < toRemove; i++) {
    localStorage.removeItem(entries[i].key);
  }
}

/**
 * Get cache size estimate
 */
export function getCacheSize(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  let size = 0;
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith(CACHE_PREFIX)) {
      const value = localStorage.getItem(key);
      if (value) {
        size += key.length + value.length;
      }
    }
  });

  return size;
}

