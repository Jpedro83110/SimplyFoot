import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function Accueil() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

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
});
