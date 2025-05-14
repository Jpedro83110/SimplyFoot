import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StatistiquesGraph() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Graphique des Statistiques</Text>
      <Text style={styles.subtitle}>Graphiques à venir...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f6fa',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2f3640',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#2f3640',
  },
});
