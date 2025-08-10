import { Database } from '@/types/database.types';
import { createClient } from '@supabase/supabase-js';

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
