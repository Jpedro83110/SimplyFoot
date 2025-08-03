import { useEffect, useState } from 'react';
import { Slot, useRouter, usePathname } from 'expo-router';
import { View, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import Header from '../../components/business/Header';

export default function PresidentLayout() {
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

      const { data: user, error } = await supabase
        .from('utilisateurs')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error || !user) {
        router.replace('/auth/login-club');
        return;
      }

      const role = user.role;

      if (role === 'president' || role === 'admin') {
        setAuthorized(true);
      } else {
        router.replace('/auth/login-club');
      }

      setChecking(false);
    };

    checkRole();
  }, []);

  const getPageTitle = () => {
    const pathSegments = pathname.split('/');
    const presidentIndex = pathSegments.indexOf('president');
    const page = pathSegments[presidentIndex + 1];
    switch (page) {
      case 'dashboard': return 'Mon Club';
      case 'membres': return 'Liste des membres';
      case 'budget': return 'Budget du club';
      case 'stages': return 'Programme de stage';
      case 'infos-publiques-club': return 'Infos publiques';
      default: return 'Espace Président';
    }
  };

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#00ff88" />
      </View>
    );
  }

  return authorized ? (
    <>
      <Header title={getPageTitle()} showBack={pathname !== '/president/dashboard'} />
      <Slot />
    </>
  ) : null;
}
