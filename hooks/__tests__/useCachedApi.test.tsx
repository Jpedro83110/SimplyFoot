import { renderHook, act, waitFor } from '@testing-library/react';
import { useCachedApi, clearAllCache, clearCacheEntry, getCacheStats } from '../useCachedApi';

// Mock console.error to avoid error logs during tests
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('useCachedApi', () => {
    beforeEach(() => {
        // Clear cache before each test
        clearAllCache();
        jest.clearAllMocks();
    });

    afterAll(() => {
        mockConsoleError.mockRestore();
    });

    describe('Basic functionality', () => {
        it('should return initial values', () => {
            const mockFetchData = jest.fn().mockResolvedValue('test data');

            const { result } = renderHook(() => useCachedApi('test-key', mockFetchData));

            const [data, loading, fetchCachedData, refresh] = result.current;

            expect(data).toBeUndefined();
            expect(loading).toBe(false);
            expect(typeof fetchCachedData).toBe('function');
            expect(typeof refresh).toBe('function');
        });

        it('should fetch and cache data', async () => {
            const mockData = { id: 1, name: 'Test' };
            const mockFetchData = jest.fn().mockResolvedValue(mockData);

            const { result } = renderHook(() => useCachedApi('test-key', mockFetchData));

            expect(result.current[0]).toBeUndefined();

            await act(async () => {
                await result.current[2](); // fetchCachedData
            });

            expect(result.current[0]).toEqual(mockData);
            expect(result.current[1]).toBe(false); // loading
            expect(mockFetchData).toHaveBeenCalledTimes(1);
        });

        it('should handle loading state', async () => {
            const mockFetchData = jest
                .fn()
                .mockImplementation(
                    () => new Promise((resolve) => setTimeout(() => resolve('data'), 100)),
                );

            const { result } = renderHook(() => useCachedApi('test-key', mockFetchData));

            act(() => {
                result.current[2](); // fetchCachedData
            });

            // During loading
            await waitFor(() => {
                expect(result.current[1]).toBe(true);
            });

            // After loading
            await waitFor(() => {
                expect(result.current[1]).toBe(false);
            });
        });
    });

    describe('Cache functionality', () => {
        it('should use cached data on second call', async () => {
            const mockData = 'cached data';
            const mockFetchData = jest.fn().mockResolvedValue(mockData);

            const { result } = renderHook(
                () => useCachedApi('cache-test', mockFetchData, 60000), // 60s TTL
            );

            // First call
            await act(async () => {
                await result.current[2]();
            });

            expect(mockFetchData).toHaveBeenCalledTimes(1);
            expect(result.current[0]).toBe(mockData);

            // Second call - should use cache
            await act(async () => {
                await result.current[2]();
            });

            expect(mockFetchData).toHaveBeenCalledTimes(1); // No additional call
            expect(result.current[0]).toBe(mockData);
        });

        it('should ignore expired cache', async () => {
            const mockData1 = 'first data';
            const mockData2 = 'second data';
            const mockFetchData = jest
                .fn()
                .mockResolvedValueOnce(mockData1)
                .mockResolvedValueOnce(mockData2);

            const { result } = renderHook(
                () => useCachedApi('expire-test', mockFetchData, 0.001), // 1ms TTL
            );

            // First call
            await act(async () => {
                await result.current[2]();
            });

            expect(result.current[0]).toBe(mockData1);

            // Wait for cache to expire
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Second call after expiration
            await act(async () => {
                await result.current[2]();
            });

            expect(mockFetchData).toHaveBeenCalledTimes(2);
            expect(result.current[0]).toBe(mockData2);
        });

        it('should force refresh data', async () => {
            const mockData1 = 'original data';
            const mockData2 = 'refreshed data';
            const mockFetchData = jest
                .fn()
                .mockResolvedValueOnce(mockData1)
                .mockResolvedValueOnce(mockData2);

            const { result } = renderHook(() => useCachedApi('refresh-test', mockFetchData, 60000));

            // First call
            await act(async () => {
                await result.current[2]();
            });

            expect(result.current[0]).toBe(mockData1);

            // Force refresh
            await act(async () => {
                await result.current[3](); // refresh
            });

            expect(mockFetchData).toHaveBeenCalledTimes(2);
            expect(result.current[0]).toBe(mockData2);
        });
    });

    describe('Error handling', () => {
        it('should handle fetch data errors', async () => {
            const mockError = new Error('Fetch failed');
            const mockFetchData = jest.fn().mockRejectedValue(mockError);

            const { result } = renderHook(() => useCachedApi('error-test', mockFetchData));

            await act(async () => {
                await result.current[2]();
            });

            expect(result.current[0]).toBeUndefined();
            expect(result.current[1]).toBe(false);
            expect(mockConsoleError).toHaveBeenCalledWith('Cache error for error-test:', mockError);
        });

        it('should not make call if key is empty', async () => {
            const mockFetchData = jest.fn().mockResolvedValue('data');

            const { result } = renderHook(() => useCachedApi('', mockFetchData));

            await act(async () => {
                await result.current[2]();
            });

            expect(mockFetchData).not.toHaveBeenCalled();
            expect(result.current[0]).toBeUndefined();
        });

        it('should not make call if already loading', async () => {
            const mockFetchData = jest
                .fn()
                .mockImplementation(
                    () => new Promise((resolve) => setTimeout(() => resolve('data'), 100)),
                );

            const { result } = renderHook(() => useCachedApi('loading-test', mockFetchData));

            // First call
            act(() => {
                result.current[2]();
            });

            // Second immediate call while loading
            act(() => {
                result.current[2]();
            });

            await waitFor(() => {
                expect(result.current[1]).toBe(false);
            });

            expect(mockFetchData).toHaveBeenCalledTimes(1);
        });
    });

    describe('Type handling', () => {
        it('should work with custom types', async () => {
            interface User {
                id: number;
                name: string;
                email: string;
            }

            const mockUser: User = {
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
            };

            const mockFetchData = jest.fn().mockResolvedValue(mockUser);

            const { result } = renderHook(() => useCachedApi<User>('user-test', mockFetchData));

            await act(async () => {
                await result.current[2]();
            });

            expect(result.current[0]).toEqual(mockUser);
            expect(result.current[0]?.name).toBe('John Doe');
        });

        it('should handle undefined data', async () => {
            const mockFetchData = jest.fn().mockResolvedValue(undefined);

            const { result } = renderHook(() => useCachedApi('undefined-test', mockFetchData));

            await act(async () => {
                await result.current[2]();
            });

            expect(result.current[0]).toBeUndefined();
            expect(mockFetchData).toHaveBeenCalledTimes(1);
        });
    });

    describe('Cache utility functions', () => {
        it('clearAllCache should clear entire cache', async () => {
            const mockFetchData1 = jest.fn().mockResolvedValue('data1');
            const mockFetchData2 = jest.fn().mockResolvedValue('data2');

            const { result: result1 } = renderHook(() => useCachedApi('key1', mockFetchData1));
            const { result: result2 } = renderHook(() => useCachedApi('key2', mockFetchData2));

            // Fill cache
            await act(async () => {
                await result1.current[2]();
                await result2.current[2]();
            });

            expect(getCacheStats().size).toBe(2);

            // Clear cache
            clearAllCache();
            expect(getCacheStats().size).toBe(0);

            // Next calls should refetch
            await act(async () => {
                await result1.current[2]();
            });

            expect(mockFetchData1).toHaveBeenCalledTimes(2);
        });

        it('clearCacheEntry should remove specific entry', async () => {
            const mockFetchData = jest.fn().mockResolvedValue('data');

            const { result } = renderHook(() => useCachedApi('specific-key', mockFetchData));

            // Fill cache
            await act(async () => {
                await result.current[2]();
            });

            expect(getCacheStats().keys).toContain('specific-key');

            // Remove specific entry
            clearCacheEntry('specific-key');
            expect(getCacheStats().keys).not.toContain('specific-key');

            // Next call should refetch
            await act(async () => {
                await result.current[2]();
            });

            expect(mockFetchData).toHaveBeenCalledTimes(2);
        });

        it('getCacheStats should return cache statistics', async () => {
            expect(getCacheStats()).toEqual({ size: 0, keys: [] });

            const mockFetchData = jest.fn().mockResolvedValue('data');

            const { result } = renderHook(() => useCachedApi('stats-test', mockFetchData));

            await act(async () => {
                await result.current[2]();
            });

            const stats = getCacheStats();
            expect(stats.size).toBe(1);
            expect(stats.keys).toContain('stats-test');
        });
    });

    describe('Edge cases', () => {
        it('should handle multiple hooks with same key', async () => {
            const mockFetchData = jest.fn().mockResolvedValue('shared data');

            const { result: result1 } = renderHook(() => useCachedApi('shared-key', mockFetchData));
            const { result: result2 } = renderHook(() => useCachedApi('shared-key', mockFetchData));

            await act(async () => {
                await result1.current[2]();
            });

            await act(async () => {
                await result2.current[2]();
            });

            // Only one API call should be made thanks to cache
            expect(mockFetchData).toHaveBeenCalledTimes(1);
            expect(result1.current[0]).toBe('shared data');
            expect(result2.current[0]).toBe('shared data');
        });

        it('should handle custom TTLs', async () => {
            const shortTTL = 0.001; // 1ms
            const longTTL = 60; // 60s

            const mockFetchData1 = jest.fn().mockResolvedValue('short data');
            const mockFetchData2 = jest.fn().mockResolvedValue('long data');

            const { result: shortResult } = renderHook(() =>
                useCachedApi('short-ttl', mockFetchData1, shortTTL),
            );
            const { result: longResult } = renderHook(() =>
                useCachedApi('long-ttl', mockFetchData2, longTTL),
            );

            // Make first calls
            await act(async () => {
                await shortResult.current[2]();
                await longResult.current[2]();
            });

            // Wait for short cache to expire
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Make calls again
            await act(async () => {
                await shortResult.current[2]();
                await longResult.current[2]();
            });

            expect(mockFetchData1).toHaveBeenCalledTimes(2); // Cache expired
            expect(mockFetchData2).toHaveBeenCalledTimes(1); // Cache valid
        });
    });
});
