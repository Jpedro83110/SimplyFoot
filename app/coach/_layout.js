import { useEffect, useState } from 'react';
import { Slot, useRouter, usePathname } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';

export default function CoachLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/auth/login-club');
        return;
      }

      const userId = session.user.id;
      const { data: user, error } = await supabase
        .from('utilisateurs')
        .select('role')
        .eq('id', userId)
        .single();

      if (error || !user) {
        router.replace('/auth/login-club');
        return;
      }

      const role = user.role;

      if (role === 'coach' || role === 'admin') {
        setAuthorized(true);
      } else {
        router.replace('/auth/login-club');
      }

      setChecking(false);
    };

    checkRole();
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#00ff88" />
      </View>
    );
  }

  const getPageTitle = () => {
    const path = pathname.split('/').pop();
    switch (path) {
      case 'dashboard': return 'Dashboard Coach';
      case 'convocation': return 'Convocations';
      case 'composition': return 'Composition';
      case 'creation-evenement': return 'Créer un événement';
      case 'evaluation-mentale': return 'Évaluation mentale';
      case 'evaluation-technique': return 'Évaluation technique';
      default: return 'Espace Coach';
    }
  };

  return authorized ? (
    <>
      <Header title={getPageTitle()} />
      <Slot />
    </>
  ) : null;
}
