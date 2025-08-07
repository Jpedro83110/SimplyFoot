import { useState, useCallback } from 'react';

type UseCachedApiReturn<T> = [T | undefined, boolean, () => Promise<void>, () => Promise<void>];

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

// Global typed cache
const cache = new Map<string, CacheEntry<any>>(); // FIXME: use a context or a more structured cache manager

/**
 * Typed cache hook to optimize requests
 * @param key - Unique key for cache
 * @param fetchData - Async function that retrieves data
 * @param ttl - Time To Live in seconds (default: 5 minutes)
 * @returns [data, refreshFunction, loading]
 */
function useCachedApi<T>(
    key: string,
    fetchData: () => Promise<T | undefined>,
    ttl: number = 60 * 5,
): UseCachedApiReturn<T | undefined> {
    const [data, setData] = useState<T | undefined>();
    const [loading, setLoading] = useState<boolean>(false);

    const isValidCache = useCallback((entry: CacheEntry<T>): boolean => {
        const now = Date.now();
        return now - entry.timestamp < entry.ttl * 1000;
    }, []);

    const fetchCachedData = useCallback(async (): Promise<void> => {
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
            const result = await fetchData();

            // Store in cache
            cache.set(key, {
                data: result,
                timestamp: Date.now(),
                ttl,
            });

            setData(result);
        } catch (error) {
            console.error(`Cache error for ${key}:`, error);
            setData(undefined);
        } finally {
            setLoading(false);
        }
    }, [key, loading, isValidCache, fetchData, ttl]);

    const refresh = useCallback(async (): Promise<void> => {
        cache.delete(key); // Force refresh
        await fetchCachedData();
    }, [key, fetchCachedData]);

    return [data, loading, fetchCachedData, refresh];
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
    cache.clear();
}

/**
 * Clear specific cache entry
 */
export function clearCacheEntry(key: string): void {
    cache.delete(key);
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
    return {
        size: cache.size,
        keys: Array.from(cache.keys()),
    };
}

export { useCachedApi };
