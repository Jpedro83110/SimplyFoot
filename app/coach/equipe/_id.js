import React from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function EquipeDetail() {
  const { id } = useLocalSearchParams();

  const joueurs = [
    { id: '1', nom: 'Jean Dupont', poste: 'Gardien' },
    { id: '2', nom: 'Lucas Martin', poste: 'Défenseur' },
    { id: '3', nom: 'Kevin Lopez', poste: 'Milieu' },
    { id: '4', nom: 'Yanis Boucher', poste: 'Attaquant' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>⚽ Équipe #{id}</Text>

      <View style={styles.block}>
        <Text style={styles.label}>Nom de l'équipe :</Text>
        <Text style={styles.value}>Les Champions</Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>Entraîneur :</Text>
        <Text style={styles.value}>Coach John</Text>
      </View>

      <Text style={styles.sectionTitle}>👥 Liste des joueurs</Text>

      <FlatList
        data={joueurs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.playerCard}>
            <Text style={styles.playerName}>{item.nom}</Text>
            <Text style={styles.playerPoste}>{item.poste}</Text>
          </View>
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: '#00ff88',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  block: {
    marginBottom: 15,
  },
  label: {
    color: '#aaa',
    fontSize: 16,
  },
  value: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    color: '#00ff88',
    fontWeight: 'bold',
    marginVertical: 20,
  },
  playerCard: {
    backgroundColor: '#1e1e1e',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  playerPoste: {
    color: '#aaa',
    fontSize: 14,
  },
});
