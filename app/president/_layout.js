import { useEffect, useState } from 'react';
import { Slot, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function PresidentLayout() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // MOCK : change ici le rôle pour tester
    const mockRole = 'president'; // 'president' | 'coach' | 'joueur' | null

    if (mockRole === 'president') {
      setAuthorized(true);
    } else {
      router.replace('/auth/login-club'); // redirige vers login club si pas autorisé
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
