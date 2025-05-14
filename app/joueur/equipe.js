import React from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';

export default function Equipe() {
  const players = [
    { id: 1, name: 'John Doe', position: 'Attaquant', stats: '10 buts' },
    { id: 2, name: 'Jane Smith', position: 'Milieu', stats: '5 passes décisives' },
    { id: 3, name: 'Alex Mercier', position: 'Gardien', stats: '3 clean sheets' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>👥 Mon Équipe</Text>

      <FlatList
        data={players}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardDetail}>Poste : {item.position}</Text>
            <Text style={styles.cardDetail}>Stats : {item.stats}</Text>
          </View>
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    padding: 20,
    flex: 1,
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
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardDetail: {
    color: '#aaa',
    fontSize: 14,
  },
});
