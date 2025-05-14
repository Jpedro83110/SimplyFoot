import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Slot, useRouter } from 'expo-router';

export default function AuthLayout() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // VERSION MOCKÉE : change ce rôle pour tester les redirections
    const mockRole = null; // 'coach' | 'president' | 'joueur' | null

    if (mockRole === 'president') {
      router.replace('/president/dashboard');
    } else if (mockRole === 'coach') {
      router.replace('/coach/dashboard');
    } else if (mockRole === 'joueur') {
      router.replace('/joueur/dashboard');
    } else {
      setChecking(false); // Pas connecté, on reste sur login
    }
  }, []);

  if (checking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ff88" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/logo.png')} style={styles.logo} />
      <Text style={styles.title}>Bienvenue sur SimplyFoot</Text>
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#00ff88',
    marginBottom: 30,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 20,
  },
});
