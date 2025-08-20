import { renderHook } from '@testing-library/react';
import { AuthContext } from '@/context/AuthContext';
import { useSession } from '../useSession';
import { ReactNode } from 'react';

// Mock Supabase to avoid ES module issues
jest.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            getUser: jest.fn(),
            signInWithPassword: jest.fn(),
            signOut: jest.fn(),
        },
    },
}));

describe('useSession', () => {
    it('should throw error when not wrapped in AuthProvider', () => {
        expect(() => {
            renderHook(() => useSession());
        }).toThrow('useSession must be wrapped in a <AuthProvider />');
    });

    it('should return auth context value when wrapped in AuthProvider', () => {
        const mockAuthValue = {
            signIn: jest.fn(),
            signOut: jest.fn(),
            isLoggedIn: true,
            isLoggedOut: false,
            isLoading: false,
            utilisateur: {
                id: '1',
                role: 'joueur',
                email: 'player@example.com',
                nom: null,
                prenom: null,
                club_id: null,
                joueur_id: null,
                date_creation: null,
                date_naissance: null,
                telephone: null,
                expo_push_token: null,
            },
            joueur: {
                id: '1',
                equipe_id: null,
                poste: null,
                numero_licence: null,
                visite_medicale_valide: null,
                photo_url: null,
                date_naissance: null,
                equipement: null,
                photo_profil_url: null,
            },
            updateUserData: jest.fn(),
        };

        const wrapper = ({ children }: { children: ReactNode }) => (
            <AuthContext.Provider value={mockAuthValue}>{children}</AuthContext.Provider>
        );

        const { result } = renderHook(() => useSession(), { wrapper });

        expect(result.current).toEqual(mockAuthValue);
    });
});
