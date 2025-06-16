import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export function useSessionReady(delay = 100) {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const check = async () => {
      console.log('[HOOK] Vérification session démarrée');
      await new Promise((res) => setTimeout(res, delay));

      const { data: { session } } = await supabase.auth.getSession();
      console.log('[HOOK] Session récupérée :', session);

      if (isMounted) {
        setSession(session);
        setChecking(false);
      }
    };

    check();

    return () => {
      isMounted = false;
    };
  }, [delay]);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      console.log('[HOOK] Session modifiée :', newSession);
      setSession(newSession);
      setChecking(false);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return { session, checking };
}
