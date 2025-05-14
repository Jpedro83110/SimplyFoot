import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function JoueurDashboard() {
  const router = useRouter();

  const handleViewConvocations = () => {
    router.push('/joueur/convocation');
  };

  const handleViewMessages = () => {
    router.push('/joueur/messages');
  };

  const handleViewTeam = () => {
    router.push('/joueur/equipe');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require('../../assets/logo.png')} style={styles.avatar} />

      <Text style={styles.title}>Bienvenue John Doe</Text>
      <Text style={styles.subtitle}>Poste : Attaquant</Text>

      <TouchableOpacity style={styles.button} onPress={handleViewConvocations}>
        <Text style={styles.buttonText}>📅 Mes convocations</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleViewMessages}>
        <Text style={styles.buttonText}>💬 Mes messages</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleViewTeam}>
        <Text style={styles.buttonText}>👥 Mon équipe</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#00ff88',
  },
  title: {
    fontSize: 24,
    color: '#00ff88',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#00ff88',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});
