import React from 'react';
import { render, act } from '@testing-library/react';
import { AuthContext, AuthProvider } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as JoueursHelper from '@/helpers/joueurs.helper';
import * as UtilisateursHelper from '@/helpers/utilisateurs.helper';
import * as StaffHelper from '@/helpers/staff.helper';
import * as ClubAdminsHelper from '@/helpers/clubsAdmins.helper';
import { useStorageState } from '@/hooks/useStorageState';
import { localStorageMock } from '../../.jest/localStorageMock';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            signInWithPassword: jest.fn(),
            signOut: jest.fn(),
        },
    },
}));

jest.mock('expo-router', () => ({
    router: {
        replace: jest.fn(),
    },
}));

jest.mock('react-native-toast-message', () => ({
    show: jest.fn(),
}));

jest.mock('@/hooks/useStorageState');

jest.mock('@/helpers/joueurs.helper');
jest.mock('@/helpers/utilisateurs.helper');
jest.mock('@/helpers/staff.helper');
jest.mock('@/helpers/clubsAdmins.helper');

// Helper component to access context values in tests
const TestConsumer = ({ onContextValue }: { onContextValue: jest.Mock }) => {
    const contextValue = React.useContext(AuthContext);
    React.useEffect(() => {
        onContextValue(contextValue);
    }, [contextValue, onContextValue]);
    return null;
};

const setSession = (value: string) => {
    localStorageMock.setItem('user-data', value);
};

describe('AuthContext', () => {
    // Reset mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Tests for signIn
    describe('signIn', () => {
        test('should successfully sign in as a player', async () => {
            // Mock user and auth response
            const mockUser = { id: 'user123' };
            const mockUtilisateur = {
                id: 'user123',
                role: 'joueur',
                joueur_id: 'joueur123',
            };
            const mockJoueur = { id: 'joueur123' };

            // Set up mocks
            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: { user: mockUser },
                error: null,
            });
            (UtilisateursHelper.getUtilisateurById as jest.Mock).mockResolvedValue(mockUtilisateur);
            (JoueursHelper.getJoueurById as jest.Mock).mockResolvedValue(mockJoueur);
            (useStorageState as jest.Mock).mockReturnValue([[false, '{}'], setSession]);

            // Render and act
            const onContextValue = jest.fn();
            const { rerender } = render(
                <AuthProvider>
                    <TestConsumer onContextValue={onContextValue} />
                </AuthProvider>,
            );

            // Get initial context
            const initialContext = onContextValue.mock.calls[0][0];

            // Call signIn
            await act(async () => {
                await initialContext.signIn('player@example.com', 'password');
            });

            // Assert
            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'player@example.com',
                password: 'password',
            });
            expect(UtilisateursHelper.getUtilisateurById).toHaveBeenCalledWith({
                utilisateurId: 'user123',
            });
            expect(JoueursHelper.getJoueurById).toHaveBeenCalledWith({
                joueurId: 'joueur123',
            });

            // Check localStorage was set correctly
            expect(localStorageMock.getItem('user-data')).toBe(
                JSON.stringify({
                    utilisateur: mockUtilisateur,
                    joueur: mockJoueur,
                }),
            );

            // Force rerender to update context with new session
            rerender(
                <AuthProvider>
                    <TestConsumer onContextValue={onContextValue} />
                </AuthProvider>,
            );

            // Check context state was updated
            const updatedContext =
                onContextValue.mock.calls[onContextValue.mock.calls.length - 1][0];
            expect(updatedContext.utilisateur).toEqual(mockUtilisateur);
            expect(updatedContext.joueur).toEqual(mockJoueur);
            expect(updatedContext.isLoggedIn).toBe(true);
            expect(router.replace).toHaveBeenCalledWith('/joueur/dashboard');
        });

        test('should successfully sign in as a coach', async () => {
            // Mock user and auth response
            const mockUser = { id: 'user123' };
            const mockUtilisateur = {
                id: 'user123',
                role: 'coach',
            };
            const mockStaff = {
                id: 'staff123',
                photo_url: 'https://example.com/photo.jpg?cachebuster=123',
            };

            // Set up mocks
            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: { user: mockUser },
                error: null,
            });
            (UtilisateursHelper.getUtilisateurById as jest.Mock).mockResolvedValue(mockUtilisateur);
            (StaffHelper.getStaffByUtilisateurId as jest.Mock).mockResolvedValue(mockStaff);
            (useStorageState as jest.Mock).mockReturnValue([[false, '{}'], setSession]);

            // Render and act
            const onContextValue = jest.fn();
            const { rerender } = render(
                <AuthProvider>
                    <TestConsumer onContextValue={onContextValue} />
                </AuthProvider>,
            );

            // Get initial context
            const initialContext = onContextValue.mock.calls[0][0];

            // Call signIn
            await act(async () => {
                await initialContext.signIn('coach@example.com', 'password');
            });

            // Assert
            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'coach@example.com',
                password: 'password',
            });
            expect(UtilisateursHelper.getUtilisateurById).toHaveBeenCalledWith({
                utilisateurId: 'user123',
            });
            expect(StaffHelper.getStaffByUtilisateurId).toHaveBeenCalledWith({
                utilisateurId: 'user123',
            });

            // Check that photo URL was cleaned (cache busters removed)
            const sessionData = JSON.parse(localStorageMock.getItem('user-data'));
            expect(sessionData).toHaveProperty('utilisateur', mockUtilisateur);
            expect(sessionData).toHaveProperty('staff');
            expect(sessionData.staff.photo_url).toEqual('https://example.com/photo.jpg');

            // Force rerender to update context with new session
            rerender(
                <AuthProvider>
                    <TestConsumer onContextValue={onContextValue} />
                </AuthProvider>,
            );

            // Check context state was updated
            const updatedContext =
                onContextValue.mock.calls[onContextValue.mock.calls.length - 1][0];
            expect(updatedContext.utilisateur).toEqual(mockUtilisateur);
            expect(updatedContext.staff.photo_url).toEqual('https://example.com/photo.jpg');
            expect(updatedContext.isLoggedIn).toBe(true);
            expect(router.replace).toHaveBeenCalledWith('/coach/dashboard');
        });

        test('should successfully sign in as a president', async () => {
            // Mock user and auth response
            const mockUser = { id: 'user123' };
            const mockUtilisateur = {
                id: 'user123',
                role: 'president',
            };
            const mockClubAdmin = { id: 'clubadmin123' };

            // Set up mocks
            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: { user: mockUser },
                error: null,
            });
            (UtilisateursHelper.getUtilisateurById as jest.Mock).mockResolvedValue(mockUtilisateur);
            (ClubAdminsHelper.getClubAdminByUserId as jest.Mock).mockResolvedValue(mockClubAdmin);
            (useStorageState as jest.Mock).mockReturnValue([[false, '{}'], setSession]);

            // Render and act
            const onContextValue = jest.fn();
            const { rerender } = render(
                <AuthProvider>
                    <TestConsumer onContextValue={onContextValue} />
                </AuthProvider>,
            );

            // Get initial context
            const initialContext = onContextValue.mock.calls[0][0];

            // Call signIn
            await act(async () => {
                await initialContext.signIn('president@example.com', 'password');
            });

            // Assert
            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'president@example.com',
                password: 'password',
            });
            expect(UtilisateursHelper.getUtilisateurById).toHaveBeenCalledWith({
                utilisateurId: 'user123',
            });
            expect(ClubAdminsHelper.getClubAdminByUserId).toHaveBeenCalledWith({
                userId: 'user123',
            });

            // Check localStorage was set correctly
            expect(localStorageMock.getItem('user-data')).toBe(
                JSON.stringify({
                    utilisateur: mockUtilisateur,
                    clubAdmin: mockClubAdmin,
                }),
            );

            // Force rerender to update context with new session
            rerender(
                <AuthProvider>
                    <TestConsumer onContextValue={onContextValue} />
                </AuthProvider>,
            );

            // Check context state was updated
            const updatedContext =
                onContextValue.mock.calls[onContextValue.mock.calls.length - 1][0];
            expect(updatedContext.utilisateur).toEqual(mockUtilisateur);
            expect(updatedContext.clubAdmin).toEqual(mockClubAdmin);
            expect(updatedContext.isLoggedIn).toBe(true);
            expect(router.replace).toHaveBeenCalledWith('/president/dashboard');
        });

        test('should handle invalid credentials error', async () => {
            // Mock error response
            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: null,
                error: {
                    code: 'invalid_credentials',
                    message: 'Invalid credentials',
                },
            });

            // Render and act
            const onContextValue = jest.fn();
            render(
                <AuthProvider>
                    <TestConsumer onContextValue={onContextValue} />
                </AuthProvider>,
            );

            // Get initial context
            const initialContext = onContextValue.mock.calls[0][0];

            // Call signIn and expect it to throw
            await expect(
                initialContext.signIn('test@example.com', 'wrongpassword'),
            ).rejects.toEqual({
                code: 'invalid_credentials',
                message: 'Invalid credentials',
            });

            // Check Toast was shown with proper message
            expect(Toast.show).toHaveBeenCalledWith({
                type: 'error',
                text1: 'Email ou mot de passe incorrect.',
            });
        });

        test('should handle unknown error', async () => {
            // Mock error response
            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: null,
                error: {
                    code: 'server_error',
                    message: 'Server error occurred',
                },
            });

            // Render and act
            const onContextValue = jest.fn();
            render(
                <AuthProvider>
                    <TestConsumer onContextValue={onContextValue} />
                </AuthProvider>,
            );

            // Get initial context
            const initialContext = onContextValue.mock.calls[0][0];

            // Call signIn and expect it to throw
            await expect(initialContext.signIn('test@example.com', 'password')).rejects.toEqual({
                code: 'server_error',
                message: 'Server error occurred',
            });

            // Check Toast was shown with proper message
            expect(Toast.show).toHaveBeenCalledWith({
                type: 'error',
                text1: 'Erreur : Server error occurred',
            });
        });

        test('should handle unknown role', async () => {
            // Mock user and auth response
            const mockUser = { id: 'user123' };
            const mockUtilisateur = {
                id: 'user123',
                role: 'unknown_role',
            };

            // Set up mocks
            (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
                data: { user: mockUser },
                error: null,
            });
            (UtilisateursHelper.getUtilisateurById as jest.Mock).mockResolvedValue(mockUtilisateur);
            (supabase.auth.signOut as jest.Mock).mockResolvedValue({
                error: null,
            });

            // Mock console.warn to avoid test output clutter
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

            // Render and act
            const onContextValue = jest.fn();
            render(
                <AuthProvider>
                    <TestConsumer onContextValue={onContextValue} />
                </AuthProvider>,
            );

            // Get initial context
            const initialContext = onContextValue.mock.calls[0][0];

            // Call signIn
            await act(async () => {
                await initialContext.signIn('unknown@example.com', 'password');
            });

            // Should log warning about unknown role
            expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown role'));

            // Should call signOut because of unknown role
            expect(supabase.auth.signOut).toHaveBeenCalled();

            // Clean up
            consoleWarnSpy.mockRestore();
        });
    });

    // Tests for signOut
    describe('signOut', () => {
        test('should successfully sign out', async () => {
            // Mock initial state with logged in user
            const mockUtilisateur = { id: 'user123', role: 'joueur' };

            // Set up mocks
            (supabase.auth.signOut as jest.Mock).mockResolvedValue({
                error: null,
            });
            (useStorageState as jest.Mock)
                .mockReturnValueOnce([
                    [false, JSON.stringify({ utilisateur: mockUtilisateur })],
                    setSession,
                ])
                .mockReturnValue([[false, undefined], setSession]);

            // Render and act
            const onContextValue = jest.fn();
            const { rerender } = render(
                <AuthProvider>
                    <TestConsumer onContextValue={onContextValue} />
                </AuthProvider>,
            );

            // Force rerender to update context with initial session
            rerender(
                <AuthProvider>
                    <TestConsumer onContextValue={onContextValue} />
                </AuthProvider>,
            );

            // Get context with session
            const initialContext =
                onContextValue.mock.calls[onContextValue.mock.calls.length - 1][0];
            expect(initialContext.utilisateur).toEqual(mockUtilisateur);

            // Call signOut
            await act(async () => {
                await initialContext.signOut();
            });

            // Assert supabase signOut was called
            expect(supabase.auth.signOut).toHaveBeenCalled();

            // Check localStorage was cleared
            expect(localStorageMock.getItem('user-data')).toBeUndefined();

            console.log('before rerender');
            // Force rerender to update context after signOut
            rerender(
                <AuthProvider>
                    <TestConsumer onContextValue={onContextValue} />
                </AuthProvider>,
            );

            // Check context state was updated
            const updatedContext =
                onContextValue.mock.calls[onContextValue.mock.calls.length - 1][0];
            expect(updatedContext.utilisateur).toBeUndefined();
            expect(updatedContext.isLoggedIn).toBe(false);
            expect(updatedContext.isLoggedOut).toBe(true);
            expect(router.replace).toHaveBeenCalledWith('/');
        });

        test('should sign out even if error occurs', async () => {
            // Mock initial state with logged in user
            const mockUtilisateur = { id: 'user123', role: 'joueur' };

            // Set up mocks to throw error on signOut
            (supabase.auth.signOut as jest.Mock).mockRejectedValue(new Error('Network error'));
            (useStorageState as jest.Mock)
                .mockReturnValueOnce([
                    [false, JSON.stringify({ utilisateur: mockUtilisateur })],
                    setSession,
                ])
                .mockReturnValue([[false, undefined], setSession]);

            // Mock console.error to avoid cluttering test output
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            // Render and act
            const onContextValue = jest.fn();
            const { rerender } = render(
                <AuthProvider>
                    <TestConsumer onContextValue={onContextValue} />
                </AuthProvider>,
            );

            // Force rerender to update context with initial session
            rerender(
                <AuthProvider>
                    <TestConsumer onContextValue={onContextValue} />
                </AuthProvider>,
            );

            // Get context with session
            const initialContext =
                onContextValue.mock.calls[onContextValue.mock.calls.length - 1][0];

            // Call signOut
            await act(async () => {
                await initialContext.signOut();
            });

            // Assert error was logged
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error signing out:', expect.any(Error));

            // Check localStorage was cleared despite error
            expect(localStorageMock.getItem('user-data')).toBeUndefined();

            // Force rerender to update context after signOut
            rerender(
                <AuthProvider>
                    <TestConsumer onContextValue={onContextValue} />
                </AuthProvider>,
            );

            // Check context state was updated
            const updatedContext =
                onContextValue.mock.calls[onContextValue.mock.calls.length - 1][0];
            expect(updatedContext.utilisateur).toBeUndefined();
            expect(updatedContext.isLoggedIn).toBe(false);

            // Cleanup
            consoleErrorSpy.mockRestore();
        });
    });
});
