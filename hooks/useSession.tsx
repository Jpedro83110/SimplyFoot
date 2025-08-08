import { AuthContext, authContextDefaultValue } from '@/context/AuthContext';
import { use } from 'react';

// This hook can be used to access the user info.
export function useSession() {
    const value = use(AuthContext);

    if (value === authContextDefaultValue) {
        throw new Error('useSession must be wrapped in a <AuthProvider />');
    }

    return value;
}
