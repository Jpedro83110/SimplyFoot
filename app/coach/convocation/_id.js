import React from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function ConvocationDetail() {
  const { id } = useLocalSearchParams();

  // 🔁 Exemple de joueurs mockés
  const joueursConvoques = [
    { id: '1', nom: 'Jean Dupont', poste: 'Gardien' },
    { id: '2', nom: 'Lucas Martin', poste: 'Défenseur' },
    { id: '3', nom: 'Kevin Lopez', poste: 'Milieu' },
    { id: '4', nom: 'Yanis Boucher', poste: 'Attaquant' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📋 Convocation #{id}</Text>

      <View style={styles.infoBlock}>
        <Text style={styles.label}>Date :</Text>
        <Text style={styles.value}>Samedi 20 mars 2025</Text>
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.label}>Heure :</Text>
        <Text style={styles.value}>15h00</Text>
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.label}>Lieu :</Text>
        <Text style={styles.value}>Stade XYZ</Text>
      </View>

      <Text style={styles.subTitle}>👥 Joueurs convoqués :</Text>

      <FlatList
        data={joueursConvoques}
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
  infoBlock: {
    marginBottom: 12,
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
  subTitle: {
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
