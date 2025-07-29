import { useState, useEffect, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Global typed cache
const cache = new Map<string, CacheEntry<any>>();

/**
 * Typed cache hook to optimize requests
 * @param key - Unique key for cache
 * @param fetchFunction - Async function that retrieves data
 * @param ttl - Time To Live in seconds (default: 5 minutes)
 * @returns [data, refreshFunction, loading]
 */
function useCachedApi<T>(
  key: string | null,
  fetchFunction: () => Promise<T | null>,
  ttl: number = 300
): [T | null, () => Promise<void>, boolean] {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const isValidCache = (entry: CacheEntry<T>): boolean => {
    const now = Date.now();
    return (now - entry.timestamp) < (entry.ttl * 1000);
  };

  const fetchData = useCallback(async (): Promise<void> => {
    if (!key || loading) return;
    
    setLoading(true);
    try {
      // Check cache first
      const cached = cache.get(key) as CacheEntry<T> | undefined;
      if (cached && isValidCache(cached)) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      // Fetch fresh data
      const result = await fetchFunction();
      
      // Store in cache
      cache.set(key, {
        data: result,
        timestamp: Date.now(),
        ttl
      });
      
      setData(result);
    } catch (error) {
      console.error('Cache error for', key, ':', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [key, fetchFunction, ttl, isValidCache]);

  useEffect(() => {
    if(data === null) {
      fetchData();
    }
  }, [fetchData]);

  const refresh = useCallback(async (): Promise<void> => {
    if (key) {
      cache.delete(key); // Force refresh
      await fetchData();
    }
  }, [key, fetchData]);

  return [data, refresh, loading];
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
  cache.clear();
  console.log('🗑️ Global cache cleared');
}

/**
 * Clear specific cache entry
 */
export function clearCacheEntry(key: string): void {
  cache.delete(key);
  console.log('🗑️ Cache cleared for:', key);
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
}

export { useCachedApi };
