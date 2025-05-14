import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function EvenementCard({ title, type, date, time, location, onPress }) {
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
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.cardTitle}>{getEmoji(type)} {title}</Text>
      <Text style={styles.detail}>📅 {date} à {time}</Text>
      <Text style={styles.detail}>📍 {location}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e1e1e',
    padding: 16,
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
  detail: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 4,
  },
});
