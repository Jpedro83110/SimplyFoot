import { renderHook } from '@testing-library/react';
import { AuthContext } from '@/context/AuthContext';
import { useSession } from '../useSession';
import { ReactNode } from 'react';
import { UtilisateurRole } from '@/types/Utilisateur';

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
                role: 'joueur' as UtilisateurRole,
                email: 'player@example.com',
            },
            joueur: { id: '1' },
            updateUserData: jest.fn(),
        };

        const wrapper = ({ children }: { children: ReactNode }) => (
            <AuthContext.Provider value={mockAuthValue}>{children}</AuthContext.Provider>
        );

        const { result } = renderHook(() => useSession(), { wrapper });

        expect(result.current).toEqual(mockAuthValue);
    });
});
