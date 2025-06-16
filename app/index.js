import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function Accueil() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setLoggedIn(!!data.session?.user);
    })();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {loggedIn && (
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>🔓 Se déconnecter</Text>
        </TouchableOpacity>
      )}

      <Image source={require('../assets/logo.png')} style={styles.logoImage} />

      <Text style={styles.title}>Bienvenue sur</Text>
      <Text style={styles.logo}>⚽ SimplyFoot</Text>
      <Text style={styles.subtitle}>L'application des clubs de foot amateur</Text>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/auth/login-club')}>
        <Text style={styles.buttonText}>Connexion Club (Président / Coach)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonOutline} onPress={() => router.push('/auth/login-joueur')}>
        <Text style={styles.buttonTextOutline}>Connexion Parent / Joueur</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    color: '#00ff88',
    fontWeight: '600',
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginVertical: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaaaaa',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#00ff88',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonOutline: {
    borderColor: '#00ff88',
    borderWidth: 2,
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginTop: 15,
    width: '100%',
    alignItems: 'center',
  },
  buttonTextOutline: {
    color: '#00ff88',
    fontWeight: '700',
    fontSize: 16,
  },
  logoutButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#1e1e1e',
    borderColor: '#00ff88',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  logoutText: {
    color: '#00ff88',
    fontSize: 13,
    fontWeight: '600',
  },
});
