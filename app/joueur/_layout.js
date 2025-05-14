import { useEffect, useState } from 'react';
import { Slot, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function JoueurLayout() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // MOCK : modifie ici pour tester le comportement
    const mockRole = 'joueur'; // 'joueur' | 'coach' | 'president' | null

    if (mockRole === 'joueur') {
      setAuthorized(true);
    } else {
      router.replace('/auth/login-joueur'); // redirection si pas joueur
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
