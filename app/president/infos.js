import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function Infos() {
  const infosClub = {
    nom: 'Les Champions FC',
    adresse: '123 Rue du Stade, Ville',
    site: 'www.leschampionsfc.com',
    reseaux: '@LesChampionsFC',
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🏟️ Informations du Club</Text>

      <View style={styles.infoBlock}>
        <Text style={styles.label}>📛 Nom du club</Text>
        <Text style={styles.value}>{infosClub.nom}</Text>
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.label}>📍 Adresse</Text>
        <Text style={styles.value}>{infosClub.adresse}</Text>
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.label}>🌐 Site Web</Text>
        <Text style={styles.value}>{infosClub.site}</Text>
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.label}>📱 Réseaux sociaux</Text>
        <Text style={styles.value}>{infosClub.reseaux}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    padding: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    color: '#00ff88',
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  infoBlock: {
    backgroundColor: '#1e1e1e',
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  label: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 6,
  },
  value: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
