import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';

export default function Convocation() {
  const convocations = [
    { id: 1, title: 'Match contre Team A', date: '20/03/2025', time: '15:00', location: 'Stade XYZ' },
    { id: 2, title: 'Entraînement', date: '22/03/2025', time: '17:00', location: 'Complexe Sportif ABC' },
  ];

  const handleResponse = (id, status) => {
    Alert.alert(`✅ Réponse enregistrée`, `Convocation ${id} ${status}`);
    // À connecter à Supabase plus tard
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📋 Mes Convocations</Text>

      {convocations.map((convocation) => (
        <View key={convocation.id} style={styles.card}>
          <Text style={styles.cardTitle}>{convocation.title}</Text>
          <Text style={styles.cardDetail}>📅 {convocation.date} à {convocation.time}</Text>
          <Text style={styles.cardDetail}>📍 {convocation.location}</Text>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.accept]}
              onPress={() => handleResponse(convocation.id, 'acceptée')}
            >
              <Text style={styles.buttonText}>✅ Accepter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.decline]}
              onPress={() => handleResponse(convocation.id, 'refusée')}
            >
              <Text style={styles.buttonText}>❌ Refuser</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1e1e1e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  cardDetail: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 6,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  accept: {
    backgroundColor: '#00ff88',
  },
  decline: {
    backgroundColor: '#ff4d4d',
  },
  buttonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
});
