import { AuthContext, authContextDefaultValue } from '@/contexts/AuthContext';
import { useContext } from 'react';

// This hook can be used to access the user info.
export function useSession() {
    const value = useContext(AuthContext);

    if (value === authContextDefaultValue) {
        throw new Error('useSession must be wrapped in a <AuthProvider />');
    }

    return value;
}
