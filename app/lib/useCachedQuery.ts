"use client";

import { useQuery } from "convex/react";
import { useOffline } from "./useOffline";
import { getCachedData, setCachedData } from "./offlineCache";
import { useEffect, useState, useMemo } from "react";

/**
 * Synchronously read from localStorage cache (for immediate initialization)
 * This prevents the flash of "signed out" state when navigating offline
 */
function getCachedDataSync<T>(cacheKey: string, maxAge?: number): T | null {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return null;
  }

  try {
    const CACHE_PREFIX = "myticket_cache_";
    const CACHE_VERSION = "v1";
    const fullCacheKey = `${CACHE_PREFIX}${CACHE_VERSION}_${cacheKey}`;
    const cached = localStorage.getItem(fullCacheKey);

    if (!cached) {
      return null;
    }

    const entry = JSON.parse(cached) as { data: T; timestamp: number; expiresAt?: number };
    const now = Date.now();

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < now) {
      localStorage.removeItem(fullCacheKey);
      return null;
    }

    // Check max age
    if (maxAge && now - entry.timestamp > maxAge) {
      localStorage.removeItem(fullCacheKey);
      return null;
    }

    return entry.data;
  } catch (error) {
    // Silently fail - we'll fall back to async loading
    return null;
  }
}

/**
 * Hook that wraps Convex queries with offline caching
 * Falls back to cached data when offline
 */
export function useCachedQuery<T>(
  query: any,
  args: any,
  options?: {
    cacheKey?: string;
    cacheTTL?: number; // Time to live in milliseconds
  }
): T | undefined {
  const isOffline = useOffline();
  
  // Ensure we pass either "skip" or a valid args object (not undefined)
  const queryArgs = isOffline ? "skip" : (args === undefined ? {} : args);
  const queryResult = useQuery(query, queryArgs);
  
  // Generate cache key - must use the provided cacheKey option if available
  const cacheKey = useMemo(
    () => options?.cacheKey || `convex_${query._functionName}_${JSON.stringify(args || {})}`,
    [options?.cacheKey, query._functionName, args]
  );
  const cacheTTL = options?.cacheTTL || 24 * 60 * 60 * 1000; // Default 24 hours

  // Initialize cached data synchronously from localStorage (prevents flash of "signed out")
  const [cachedData, setCachedDataState] = useState<T | undefined>(() => {
    const syncCache = getCachedDataSync<T>(cacheKey, cacheTTL);
    return syncCache !== null ? syncCache : undefined;
  });
  
  const [isLoadingCache, setIsLoadingCache] = useState(() => {
    // If we have sync cache, we're not loading
    const syncCache = getCachedDataSync<T>(cacheKey, cacheTTL);
    return syncCache === null;
  });

  // Load cached data on mount and when cache key changes (for async updates)
  useEffect(() => {
    let cancelled = false;
    
    const loadCache = async () => {
      // If we already have sync cache, skip async load (it's redundant)
      const syncCache = getCachedDataSync<T>(cacheKey, cacheTTL);
      if (syncCache !== null) {
        setIsLoadingCache(false);
        return;
      }
      
      setIsLoadingCache(true);
      try {
        const cached = await getCachedData<T>(cacheKey, cacheTTL);
        if (!cancelled && cached !== null) {
          console.log(`[useCachedQuery] Loaded cache for ${cacheKey}:`, cached);
          setCachedDataState(cached);
        }
      } catch (error) {
        console.error("[useCachedQuery] Error loading cache:", error);
      } finally {
        if (!cancelled) {
          setIsLoadingCache(false);
        }
      }
    };
    
    loadCache();
    
    return () => {
      cancelled = true;
    };
  }, [cacheKey, cacheTTL]);

  // Cache successful query results when online
  useEffect(() => {
    if (queryResult !== undefined && !isOffline) {
      console.log(`[useCachedQuery] Caching data for key: ${cacheKey}`);
      setCachedData(cacheKey, queryResult as T, cacheTTL).then(() => {
        console.log(`[useCachedQuery] Successfully cached data for key: ${cacheKey}`);
      }).catch((error) => {
        console.error("[useCachedQuery] Failed to cache query result:", error);
      });
      // Also update cached state so it's available immediately if we go offline
      setCachedDataState(queryResult as T);
    }
  }, [queryResult, cacheKey, cacheTTL, isOffline]);

  // When offline, return cached data (or undefined if no cache yet)
  if (isOffline) {
    // Still loading cache
    if (isLoadingCache) {
      return undefined;
    }
    // Cache loaded, return it (even if undefined)
    return cachedData;
  }

  // When online, prefer query result
  if (queryResult !== undefined) {
    return queryResult as T;
  }

  // Query is loading - show cache if available
  if (cachedData !== undefined && !isLoadingCache) {
    return cachedData;
  }

  // Still loading (both query and cache)
  return undefined;
}

