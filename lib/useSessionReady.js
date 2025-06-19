import { useEffect, useState } from 'react';
import { supabase } from './supabase';

/**
 * Hook React pour attendre que la session Supabase soit prête.
 * Retourne : { session, checking }
 */
export function useSessionReady(delay = 100) {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const check = async () => {
      console.log('[HOOK] Vérification session démarrée');
      await new Promise((res) => setTimeout(res, delay)); // Petit délai pour éviter l'état "null" furtif
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[HOOK] Session récupérée :', session);
      if (isMounted) {
        setSession(session);
        setChecking(false);
      }
    };

    check();

    return () => { isMounted = false; };
  }, [delay]);

  // Abonnement au changement d'état de session
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      console.log('[HOOK] Session modifiée :', newSession);
      setSession(newSession);
      setChecking(false);
    });
    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  return { session, checking };
}
