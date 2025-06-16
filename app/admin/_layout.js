import { useEffect, useState } from 'react';
import { Slot, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function AdminLayout() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkRole = async () => {
      console.log('[ADMIN LAYOUT] Vérification session admin');

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        console.warn('[ADMIN LAYOUT] Aucune session. Redirection login club.');
        router.replace('/auth/login-club');
        return;
      }

      console.log('[ADMIN LAYOUT] Session trouvée :', session.user.email);

      const { data: user, error: roleError } = await supabase
        .from('utilisateurs')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (roleError || !user?.role) {
        console.warn('[ADMIN LAYOUT] Rôle non trouvé. Redirection login club.');
        router.replace('/auth/login-club');
        return;
      }

      if (user.role === 'admin') {
        console.log('[ADMIN LAYOUT] Accès autorisé à l’admin');
        if (isMounted) setAuthorized(true);
      } else {
        console.warn('[ADMIN LAYOUT] Accès refusé. Rôle =', user.role);
        router.replace('/auth/login-club');
        return;
      }

      if (isMounted) setChecking(false);
    };

    checkRole();

    return () => {
      isMounted = false;
    };
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#00ff88" />
      </View>
    );
  }

  return authorized ? <Slot /> : null;
}
