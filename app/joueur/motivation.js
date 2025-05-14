import React, { useState } from 'react';
import { View, Text, StyleSheet, Slider, TouchableOpacity, Dimensions, Alert, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const motivationQuotes = [
  'Tu as déjà survécu à 100% de tes mauvaises journées.',
  'Chaque jour est une nouvelle chance.',
  'L’équipe avant tout.',
  'Tu n’abandonnes pas. Tu grandis.',
  'Un effort aujourd’hui, une victoire demain.',
];

export default function Motivation() {
  const [motivation, setMotivation] = useState(5);
  const [history, setHistory] = useState([6, 7, 5, 8, 9, 7, 6]); // exemple historique (sur 7 jours)

  const handleSave = () => {
    Alert.alert('✅ Motivation enregistrée', `Tu te sens à ${motivation}/10 aujourd’hui`);
    // ➕ Tu peux ici enregistrer dans Supabase
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🔥 Motivation du jour</Text>

      <Text style={styles.motivationText}>{motivation}/10</Text>
      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={10}
        step={1}
        minimumTrackTintColor="#00ff88"
        maximumTrackTintColor="#444"
        thumbTintColor="#00ff88"
        value={motivation}
        onValueChange={(val) => setMotivation(val)}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Enregistrer</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>📈 Historique (7 derniers jours)</Text>
      <LineChart
        data={{
          labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
          datasets: [{ data: history }],
        }}
        width={Dimensions.get('window').width - 40}
        height={220}
        yAxisSuffix="/10"
        chartConfig={{
          backgroundGradientFrom: '#121212',
          backgroundGradientTo: '#121212',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 255, 136, ${opacity})`,
          labelColor: () => '#aaa',
        }}
        bezier
        style={styles.chart}
      />

      <Text style={styles.sectionTitle}>💬 Citation du jour</Text>
      <Text style={styles.quote}>
        {motivationQuotes[Math.floor(Math.random() * motivationQuotes.length)]}
      </Text>

      <TouchableOpacity style={styles.badgeButton} onPress={() => Alert.alert('🎖️ À venir', 'Système de badges bientôt disponible')}>
        <Text style={styles.badgeText}>Voir mes badges</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: '#00ff88',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  motivationText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#00ff88',
    paddingVertical: 12,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  saveText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#00ff88',
    fontWeight: 'bold',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  chart: {
    borderRadius: 10,
    marginBottom: 30,
  },
  quote: {
    color: '#ccc',
    fontStyle: 'italic',
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  badgeButton: {
    borderColor: '#00ff88',
    borderWidth: 2,
    paddingVertical: 12,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  badgeText: {
    color: '#00ff88',
    fontWeight: '700',
    fontSize: 16,
  },
});
