import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function ClubCard({ name, location, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.cardTitle}>{name}</Text>
      <Text style={styles.cardLocation}>{location}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  cardLocation: {
    fontSize: 14,
    color: '#aaa',
  },
});
