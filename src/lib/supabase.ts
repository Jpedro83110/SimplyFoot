import { getUtilisateursPushTokenByClubId } from '@/helpers/utilisateurs.helpers';
import { Database } from '@/types/database.types';
import { createClient, UserAttributes } from '@supabase/supabase-js';

const supabaseUrl = 'https://vkcojgudsrypkyxoendl.supabase.co';
const supabaseAnonKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrY29qZ3Vkc3J5cGt5eG9lbmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0ODM5OTAsImV4cCI6MjA2MzA1OTk5MH0.dkI6JyublXRtDd6DZ2LLW4i3C4tcYiOTksdcx7RxlCs';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true, // ✅ garde la session active
        autoRefreshToken: true, // ✅ rafraîchit le token automatiquement
        detectSessionInUrl: true, // ✅ supporte les liens d'auth si besoin

        // ✅ important pour que ça fonctionne aussi sur le Web
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
});

export const setSession = async ({
    accessToken,
    refreshToken,
}: {
    accessToken?: string;
    refreshToken?: string;
}) => {
    const { data, error } = await supabase.auth.setSession({
        access_token: accessToken ?? '',
        refresh_token: refreshToken ?? '',
    });

    if (error) {
        throw error;
    }

    const { user, session } = data;

    if (!user || !session) {
        throw new Error('Failed to create user.');
    }

    return { user, session };
};

export const signUp = async ({ email, password }: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
    });

    if (error) {
        throw error;
    }

    const { user, session } = data;

    if (!user || !session) {
        throw new Error('Failed to create user.');
    }

    return { user, session };
};

export const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());

    if (error) {
        throw error;
    }

    return data;
};

export const updateUser = async (userData: UserAttributes) => {
    const { data, error } = await supabase.auth.updateUser(userData);

    if (error) {
        throw error;
    }

    return data;
};

export const sendNotificationToClubUsers = async ({
    message,
    clubId,
}: {
    message: string;
    clubId: string;
}) => {
    const utilisateurs = await getUtilisateursPushTokenByClubId({ clubId });

    const tokens = utilisateurs?.filter((utilisateur) => utilisateur.expo_push_token);

    for (const token of tokens) {
        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: token,
                title: 'Nouvel événement',
                body: message,
            }),
        });
    }
};

export const storage = supabase.storage;
