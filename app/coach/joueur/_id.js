import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function JoueurDetail() {
  const { id } = useLocalSearchParams();

  // 🔁 Exemple joueur mock
  const joueur = {
    nom: 'John Doe',
    poste: 'Attaquant',
    buts: 10,
    passes: 4,
    matchs: 12,
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require('../../../assets/avatar.png')} style={styles.avatar} />

      <Text style={styles.title}>{joueur.nom}</Text>
      <Text style={styles.subtitle}>Poste : {joueur.poste}</Text>

      <View style={styles.statsBlock}>
        <Text style={styles.statsTitle}>📊 Statistiques</Text>
        <Text style={styles.statLine}>Matchs joués : {joueur.matchs}</Text>
        <Text style={styles.statLine}>Buts : {joueur.buts}</Text>
        <Text style={styles.statLine}>Passes décisives : {joueur.passes}</Text>
      </View>

      <Text style={styles.idLine}>ID joueur : #{id}</Text>
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
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#00ff88',
  },
  title: {
    fontSize: 26,
    color: '#00ff88',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 30,
  },
  statsBlock: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    marginBottom: 30,
  },
  statsTitle: {
    color: '#00ff88',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statLine: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 6,
  },
  idLine: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
});
