import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';

export default function Evenements() {
  const events = [
    { id: 1, title: 'Match contre Team A', type: 'match', date: '20/03/2025', time: '15:00', location: 'Stade XYZ' },
    { id: 2, title: 'Entraînement collectif', type: 'entrainement', date: '22/03/2025', time: '17:00', location: 'Complexe Sportif ABC' },
  ];

  const handleDetails = (event) => {
    Alert.alert(`📅 ${event.title}`, `${event.date} à ${event.time}\n📍 ${event.location}`);
    // Tu peux remplacer Alert par router.push(`/president/events/${event.id}`)
  };

  const getEmoji = (type) => {
    switch (type) {
      case 'match': return '⚽';
      case 'entrainement': return '🏋️‍♂️';
      case 'tournoi': return '🏆';
      case 'plateau': return '🎯';
      default: return '📌';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📆 Événements du Club</Text>

      {events.map((event) => (
        <View key={event.id} style={styles.card}>
          <Text style={styles.cardTitle}>{getEmoji(event.type)} {event.title}</Text>
          <Text style={styles.detailText}>📅 {event.date} à {event.time}</Text>
          <Text style={styles.detailText}>📍 {event.location}</Text>

          <TouchableOpacity style={styles.button} onPress={() => handleDetails(event)}>
            <Text style={styles.buttonText}>Détails</Text>
          </TouchableOpacity>
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
    color: '#00ff88',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1e1e1e',
    padding: 18,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  detailText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
  },
  button: {
    marginTop: 12,
    backgroundColor: '#00ff88',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
});
