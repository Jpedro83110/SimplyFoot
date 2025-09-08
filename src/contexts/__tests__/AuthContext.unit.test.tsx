import React from 'react';
import { render, act } from '@testing-library/react';
import { AuthContext, AuthProvider } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as JoueursHelper from '@/helpers/joueurs.helpers';
import * as UtilisateursHelper from '@/helpers/utilisateurs.helpers';
import * as StaffHelper from '@/helpers/staff.helpers';
import * as ClubAdminsHelper from '@/helpers/clubsAdmins.helpers';
import { localStorageMock } from '../../../.jest/localStorageMock';

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

// Mock Platform
jest.mock('react-native', () => ({
    Platform: {
        OS: 'web',
    },
}));

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
    usePathname: () => '/test-path',
    router: {
        replace: jest.fn(),
    },
}));

jest.mock('react-native-toast-message', () => ({
    show: jest.fn(),
}));

jest.mock('@/helpers/joueurs.helpers');
jest.mock('@/helpers/utilisateurs.helpers');
jest.mock('@/helpers/staff.helpers');
jest.mock('@/helpers/clubsAdmins.helpers');

// Helper component to access context values in tests
const TestConsumer = ({ onContextValue }: { onContextValue: jest.Mock }) => {
    const contextValue = React.useContext(AuthContext);
    React.useEffect(() => {
        onContextValue(contextValue);
    }, [contextValue, onContextValue]);
    return null;
};

describe('AuthContext', () => {
    // Reset mocks before each test
    beforeEach(() => {
        localStorage.clear();
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
                await initialContext.signIn({ email: 'player@example.com', password: 'password' });
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
                await initialContext.signIn({ email: 'coach@example.com', password: 'password' });
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
                await initialContext.signIn({
                    email: 'president@example.com',
                    password: 'password',
                });
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
                initialContext.signIn({ email: 'test@example.com', password: 'wrongpassword' }),
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
            await expect(
                initialContext.signIn({ email: 'test@example.com', password: 'password' }),
            ).rejects.toEqual({
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
                await initialContext.signIn({ email: 'unknown@example.com', password: 'password' });
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
            localStorage.setItem('user-data', JSON.stringify({ utilisateur: mockUtilisateur }));

            // Set up mocks
            (supabase.auth.signOut as jest.Mock).mockResolvedValue({
                error: null,
            });

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
            // Set up mocks to throw error on signOut
            (supabase.auth.signOut as jest.Mock).mockRejectedValue(new Error('Network error'));

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

    // Tests for updateUserData
    describe('updateUserData', () => {
        test('should update utilisateur data', async () => {
            // Mock initial state with logged in user
            const mockUtilisateur = { id: 'user123', role: 'joueur', email: 'old@example.com' };
            localStorage.setItem('user-data', JSON.stringify({ utilisateur: mockUtilisateur }));

            // Render
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

            // Call updateUserData with utilisateur data
            await act(async () => {
                await initialContext.updateUserData({
                    utilisateurData: { email: 'new@example.com' },
                });
            });

            // Assert helper was called with correct params
            expect(UtilisateursHelper.updateUtilisateur).toHaveBeenCalledWith({
                utilisateurId: 'user123',
                dataToUpdate: { email: 'new@example.com' },
            });

            // Check session was updated correctly
            const updatedSessionData = JSON.parse(localStorageMock.getItem('user-data'));
            expect(updatedSessionData.utilisateur.email).toBe('new@example.com');

            // Force rerender to update context
            rerender(
                <AuthProvider>
                    <TestConsumer onContextValue={onContextValue} />
                </AuthProvider>,
            );

            // Check context was updated
            const updatedContext =
                onContextValue.mock.calls[onContextValue.mock.calls.length - 1][0];
            expect(updatedContext.utilisateur.email).toBe('new@example.com');
        });

        test('should update joueur data', async () => {
            // Mock initial state
            const mockUtilisateur = { id: 'user123', role: 'joueur' };
            const mockJoueur = { id: 'joueur123', position: 'attaquant' };
            localStorage.setItem(
                'user-data',
                JSON.stringify({ utilisateur: mockUtilisateur, joueur: mockJoueur }),
            );

            // Render
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

            // Call updateUserData with joueur data
            await act(async () => {
                await initialContext.updateUserData({
                    joueurData: { position: 'défenseur' },
                });
            });

            // Assert helper was called with correct params
            expect(JoueursHelper.updateJoueur).toHaveBeenCalledWith({
                joueurId: 'joueur123',
                dataToUpdate: { position: 'défenseur' },
            });

            // Check session was updated correctly
            const updatedSessionData = JSON.parse(localStorageMock.getItem('user-data'));
            expect(updatedSessionData.joueur.position).toBe('défenseur');

            // Force rerender to update context
            rerender(
                <AuthProvider>
                    <TestConsumer onContextValue={onContextValue} />
                </AuthProvider>,
            );

            // Check context was updated
            const updatedContext =
                onContextValue.mock.calls[onContextValue.mock.calls.length - 1][0];
            expect(updatedContext.joueur.position).toBe('défenseur');
        });

        test('should update staff data', async () => {
            // Mock initial state
            const mockUtilisateur = { id: 'user123', role: 'coach' };
            const mockStaff = { id: 'staff123', niveau_diplome: 'CFF1' };
            localStorage.setItem(
                'user-data',
                JSON.stringify({ utilisateur: mockUtilisateur, staff: mockStaff }),
            );

            // Render
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

            // Call updateUserData with staff data
            await act(async () => {
                await initialContext.updateUserData({
                    staffData: { niveau_diplome: 'CFF2' },
                });
            });

            // Assert helper was called with correct params
            expect(StaffHelper.updateStaff).toHaveBeenCalledWith({
                staffId: 'staff123',
                dataToUpdate: { niveau_diplome: 'CFF2' },
            });

            // Check session was updated correctly
            const updatedSessionData = JSON.parse(localStorageMock.getItem('user-data'));
            expect(updatedSessionData.staff.niveau_diplome).toBe('CFF2');

            // Force rerender to update context
            rerender(
                <AuthProvider>
                    <TestConsumer onContextValue={onContextValue} />
                </AuthProvider>,
            );

            // Check context was updated
            const updatedContext =
                onContextValue.mock.calls[onContextValue.mock.calls.length - 1][0];
            expect(updatedContext.staff.niveau_diplome).toBe('CFF2');
        });

        test('should update clubAdmin data', async () => {
            // Mock initial state
            const mockUtilisateur = { id: 'user123', role: 'president' };
            const mockClubAdmin = { id: 'clubadmin123', role: 'president' };
            localStorage.setItem(
                'user-data',
                JSON.stringify({ utilisateur: mockUtilisateur, clubAdmin: mockClubAdmin }),
            );

            // Render
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

            // Call updateUserData with clubAdmin data
            await act(async () => {
                await initialContext.updateUserData({
                    clubAdminData: { role: 'vice-president' },
                });
            });

            // Assert helper was called with correct params
            expect(ClubAdminsHelper.updateClubAdmin).toHaveBeenCalledWith({
                clubAdminId: 'clubadmin123',
                dataToUpdate: { role: 'vice-president' },
            });

            // Check session was updated correctly
            const updatedSessionData = JSON.parse(localStorageMock.getItem('user-data'));
            expect(updatedSessionData.clubAdmin.role).toBe('vice-president');

            // Force rerender to update context
            rerender(
                <AuthProvider>
                    <TestConsumer onContextValue={onContextValue} />
                </AuthProvider>,
            );

            // Check context was updated
            const updatedContext =
                onContextValue.mock.calls[onContextValue.mock.calls.length - 1][0];
            expect(updatedContext.clubAdmin.role).toBe('vice-president');
        });

        test('should update multiple data types simultaneously', async () => {
            // Mock initial state
            const mockUtilisateur = { id: 'user123', role: 'coach', telephone: '0123456789' };
            const mockStaff = { id: 'staff123', niveau_diplome: 'CFF1', experience: '2 ans' };
            localStorage.setItem(
                'user-data',
                JSON.stringify({ utilisateur: mockUtilisateur, staff: mockStaff }),
            );

            // Set up mocks
            (UtilisateursHelper.updateUtilisateur as jest.Mock).mockResolvedValue({});
            (StaffHelper.updateStaff as jest.Mock).mockResolvedValue({});

            // Render
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

            // Call updateUserData with multiple data types
            await act(async () => {
                await initialContext.updateUserData({
                    utilisateurData: { telephone: '9876543210' },
                    staffData: {
                        niveau_diplome: 'CFF2',
                        experience: '3 ans',
                    },
                });
            });

            // Assert helpers were called with correct params
            expect(UtilisateursHelper.updateUtilisateur).toHaveBeenCalledWith({
                utilisateurId: 'user123',
                dataToUpdate: { telephone: '9876543210' },
            });

            expect(StaffHelper.updateStaff).toHaveBeenCalledWith({
                staffId: 'staff123',
                dataToUpdate: {
                    niveau_diplome: 'CFF2',
                    experience: '3 ans',
                },
            });

            // Check session was updated correctly with both changes
            const updatedSessionData = JSON.parse(localStorageMock.getItem('user-data'));
            expect(updatedSessionData.utilisateur.telephone).toBe('9876543210');
            expect(updatedSessionData.staff.niveau_diplome).toBe('CFF2');
            expect(updatedSessionData.staff.experience).toBe('3 ans');

            // Force rerender to update context
            rerender(
                <AuthProvider>
                    <TestConsumer onContextValue={onContextValue} />
                </AuthProvider>,
            );

            // Check context was updated
            const updatedContext =
                onContextValue.mock.calls[onContextValue.mock.calls.length - 1][0];
            expect(updatedContext.utilisateur.telephone).toBe('9876543210');
            expect(updatedContext.staff.niveau_diplome).toBe('CFF2');
            expect(updatedContext.staff.experience).toBe('3 ans');
        });

        test('should handle missing session', async () => {
            // Mock no session

            // Set up mocks
            (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

            // Mock console.warn to avoid test output clutter
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

            // Render
            const onContextValue = jest.fn();
            render(
                <AuthProvider>
                    <TestConsumer onContextValue={onContextValue} />
                </AuthProvider>,
            );

            // Get context
            const initialContext = onContextValue.mock.calls[0][0];

            // Call updateUserData with no session
            await act(async () => {
                await initialContext.updateUserData({
                    utilisateurData: { email: 'new@example.com' },
                });
            });

            // Should log warning about missing session
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Cannot update user data'),
            );

            // Should call signOut
            expect(supabase.auth.signOut).toHaveBeenCalled();

            // Clean up
            consoleWarnSpy.mockRestore();
        });
    });

    // Tests for general functionality
    describe('general functionality', () => {
        test('should initialize context with user not logged in', async () => {
            // Render
            const onContextValue = jest.fn();
            render(
                <AuthProvider>
                    <TestConsumer onContextValue={onContextValue} />
                </AuthProvider>,
            );

            // Check context values
            const contextValue = onContextValue.mock.calls[1][0];
            expect(contextValue.isLoggedIn).toBe(false);
            expect(contextValue.isLoggedOut).toBe(true);
            expect(contextValue.isLoading).toBe(false);
            expect(contextValue.utilisateur).toBeUndefined();
            expect(contextValue.joueur).toBeUndefined();
            expect(contextValue.staff).toBeUndefined();
            expect(contextValue.clubAdmin).toBeUndefined();

            // Check redirection
            expect(router.replace).toHaveBeenCalledWith('/');
        });

        test('should initialize context with user logged in as a player', async () => {
            // Mock session data for a player
            const mockUtilisateur = { id: 'user123', role: 'joueur' };
            const mockJoueur = { id: 'joueur123', position: 'attaquant' };
            localStorage.setItem(
                'user-data',
                JSON.stringify({
                    utilisateur: mockUtilisateur,
                    joueur: mockJoueur,
                }),
            );

            // Render
            const onContextValue = jest.fn();
            const { rerender } = render(
                <AuthProvider>
                    <TestConsumer onContextValue={onContextValue} />
                </AuthProvider>,
            );

            // Force rerender to ensure session is processed
            await act(async () => {
                rerender(
                    <AuthProvider>
                        <TestConsumer onContextValue={onContextValue} />
                    </AuthProvider>,
                );
            });

            // Get final context value after any state updates
            const contextValue = onContextValue.mock.calls[onContextValue.mock.calls.length - 1][0];

            // Check context values
            expect(contextValue.isLoggedIn).toBe(true);
            expect(contextValue.isLoggedOut).toBe(false);
            expect(contextValue.utilisateur).toEqual(mockUtilisateur);
            expect(contextValue.joueur).toEqual(mockJoueur);
            expect(contextValue.staff).toBeUndefined();
            expect(contextValue.clubAdmin).toBeUndefined();

            // Check redirection
            expect(router.replace).toHaveBeenCalledWith('/joueur/dashboard');
        });

        test('should initialize context with user logged in as a coach', async () => {
            // Mock session data for a coach
            const mockUtilisateur = { id: 'user123', role: 'coach' };
            const mockStaff = { id: 'staff123', niveau_diplome: 'CFF1' };
            localStorage.setItem(
                'user-data',
                JSON.stringify({
                    utilisateur: mockUtilisateur,
                    staff: mockStaff,
                }),
            );

            // Render
            const onContextValue = jest.fn();
            const { rerender } = render(
                <AuthProvider>
                    <TestConsumer onContextValue={onContextValue} />
                </AuthProvider>,
            );

            // Force rerender to ensure session is processed
            await act(async () => {
                rerender(
                    <AuthProvider>
                        <TestConsumer onContextValue={onContextValue} />
                    </AuthProvider>,
                );
            });

            // Get final context value after any state updates
            const contextValue = onContextValue.mock.calls[onContextValue.mock.calls.length - 1][0];

            // Check context values
            expect(contextValue.isLoggedIn).toBe(true);
            expect(contextValue.isLoggedOut).toBe(false);
            expect(contextValue.utilisateur).toEqual(mockUtilisateur);
            expect(contextValue.staff).toEqual(mockStaff);
            expect(contextValue.joueur).toBeUndefined();
            expect(contextValue.clubAdmin).toBeUndefined();

            // Check redirection
            expect(router.replace).toHaveBeenCalledWith('/coach/dashboard');
        });

        test('should initialize context with user logged in as a president', async () => {
            // Mock session data for a president
            const mockUtilisateur = { id: 'user123', role: 'president' };
            const mockClubAdmin = { id: 'clubadmin123', role: 'president' };
            localStorageMock.setItem(
                'user-data',
                JSON.stringify({
                    utilisateur: mockUtilisateur,
                    clubAdmin: mockClubAdmin,
                }),
            );

            // Render
            const onContextValue = jest.fn();
            const { rerender } = render(
                <AuthProvider>
                    <TestConsumer onContextValue={onContextValue} />
                </AuthProvider>,
            );

            // Force rerender to ensure session is processed
            await act(async () => {
                rerender(
                    <AuthProvider>
                        <TestConsumer onContextValue={onContextValue} />
                    </AuthProvider>,
                );
            });

            // Get final context value after any state updates
            const contextValue = onContextValue.mock.calls[onContextValue.mock.calls.length - 1][0];

            // Check context values
            expect(contextValue.isLoggedIn).toBe(true);
            expect(contextValue.isLoggedOut).toBe(false);
            expect(contextValue.utilisateur).toEqual(mockUtilisateur);
            expect(contextValue.clubAdmin).toEqual(mockClubAdmin);
            expect(contextValue.joueur).toBeUndefined();
            expect(contextValue.staff).toBeUndefined();

            // Check redirection
            expect(router.replace).toHaveBeenCalledWith('/president/dashboard');
        });
    });
});
