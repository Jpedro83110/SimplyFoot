import { useEffect, useState } from 'react';
import { Slot, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function CoachLayout() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // MOCK : ici on simule le rôle (à remplacer plus tard par Supabase)
    const mockRole = 'coach'; // 'coach' | 'president' | 'joueur' | null

    if (mockRole === 'coach') {
      setAuthorized(true);
    } else {
      router.replace('/auth/login-club'); // redirection vers login si pas coach
    }

    setChecking(false);
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
