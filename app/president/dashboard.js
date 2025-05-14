import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function PresidentDashboard() {
  const router = useRouter();

  const handleViewStaff = () => {
    router.push('/president/staff');
  };

  const handleViewEvents = () => {
    router.push('/president/evenements');
  };

  const handleViewClubInfo = () => {
    router.push('/president/infos');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require('../../assets/logo.png')} style={styles.logo} />

      <Text style={styles.title}>Les Champions FC</Text>
      <Text style={styles.subscription}>🟢 Abonnement actif</Text>

      <TouchableOpacity style={styles.button} onPress={handleViewStaff}>
        <Text style={styles.buttonText}>👥 Voir le staff</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleViewEvents}>
        <Text style={styles.buttonText}>📅 Voir les événements</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleViewClubInfo}>
        <Text style={styles.buttonText}>🏟️ Infos du club</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={() => Alert.alert('Déconnexion', 'Vous êtes déconnecté.')}>
        <Text style={styles.logoutText}>🚪 Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    padding: 30,
    alignItems: 'center',
    minHeight: '100%',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 6,
  },
  subscription: {
    color: '#aaa',
    fontSize: 16,
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
  logoutButton: {
    marginTop: 40,
    borderColor: '#00ff88',
    borderWidth: 2,
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  logoutText: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: '700',
  },
});
