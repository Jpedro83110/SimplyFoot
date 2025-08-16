import { renderHook, act, waitFor } from '@testing-library/react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useStorageState, setStorageItemAsync } from '../useStorageState';

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

// Mock Platform
jest.mock('react-native', () => ({
    Platform: {
        OS: 'ios',
    },
}));

describe('useStorageState', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset Platform.OS to default
        Platform.OS = 'ios';
    });

    describe('Native Platform', () => {
        it('should initialize with loading state', () => {
            (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-value');

            const { result } = renderHook(() => useStorageState('test-key'));

            expect(result.current[0][0]).toBe(true); // loading
            expect(result.current[0][1]).toBe(null); // value
        });

        it('should load value from SecureStore on mount', async () => {
            (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('stored-value');

            const { result } = renderHook(() => useStorageState('test-key'));

            await waitFor(() => {
                expect(result.current[0][0]).toBe(false); // loading
            });

            expect(SecureStore.getItemAsync).toHaveBeenCalledWith('test-key');
            expect(result.current[0][1]).toBe('stored-value'); // value
        });

        it('should handle null value from SecureStore', async () => {
            (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

            const { result } = renderHook(() => useStorageState('test-key'));

            await waitFor(() => {
                expect(result.current[0][0]).toBe(false); // loading
            });

            expect(result.current[0][1]).toBe(null);
        });

        it('should set value and update SecureStore', async () => {
            (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
            (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

            const { result } = renderHook(() => useStorageState('test-key'));

            await waitFor(() => {
                expect(result.current[0][0]).toBe(false); // loading
            });

            act(() => {
                result.current[1]('new-value');
            });

            expect(result.current[0][1]).toBe('new-value');
            expect(SecureStore.setItemAsync).toHaveBeenCalledWith('test-key', 'new-value');
        });

        it('should delete value when setting null', async () => {
            (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('existing-value');
            (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

            const { result } = renderHook(() => useStorageState('test-key'));

            await waitFor(() => {
                expect(result.current[0][0]).toBe(false); // loading
            });

            act(() => {
                result.current[1](null);
            });

            expect(result.current[0][1]).toBe(null);
            expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('test-key');
        });
    });

    describe('Web Platform', () => {
        beforeEach(() => {
            Platform.OS = 'web';
            localStorage.setItem('test-key', 'web-value');
        });

        it('should load value from localStorage on web', () => {
            const { result } = renderHook(() => useStorageState('test-key'));

            expect(result.current[0][1]).toBe('web-value');
        });

        it('should set value in localStorage on web', () => {
            const { result } = renderHook(() => useStorageState('test-key'));

            act(() => {
                result.current[1]('web-new-value');
            });

            expect(result.current[0][1]).toBe('web-new-value');
        });

        it('should remove value from localStorage when setting null', () => {
            const { result } = renderHook(() => useStorageState('test-key'));

            act(() => {
                result.current[1](null);
            });

            expect(result.current[0][1]).toBe(null);
        });
    });

    describe('setStorageItemAsync', () => {
        it('should use SecureStore on native platforms', async () => {
            Platform.OS = 'ios';

            await setStorageItemAsync('test-key', 'test-value');

            expect(SecureStore.setItemAsync).toHaveBeenCalledWith('test-key', 'test-value');
        });

        it('should delete from SecureStore when value is null', async () => {
            Platform.OS = 'android';

            await setStorageItemAsync('test-key', null);

            expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('test-key');
        });

        it('should use localStorage on web', async () => {
            Platform.OS = 'web';

            await setStorageItemAsync('test-key', 'web-value');

            expect(localStorage.getItem('test-key')).toBe('web-value');
        });
    });
});
